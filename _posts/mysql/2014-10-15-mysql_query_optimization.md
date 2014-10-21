---
layout: post  
title: "查询性能优化"
description: ""
category: 读书笔记--高性能mysql
tags: [mysql,高性能mysql]
---
{% include JB/setup %}
# 查询性能优化
---


###1.慢查询基础:优化数据访问

大部分性能低下的查询都可以通过减少访问的数据量的方式进行优化。对于低效的查询，同通过下面两个步骤分析：

* 确认应用程序是否在检索大量超过需要的数据。这通常意味着访问了太多的行，但有时候也可能是访问太多的列。
* 确认mysql服务器层是否分析大量超过需要的数据行。


####1.1 是否向数据库请求了不需要的数据

>有些查询会请求超过实际需要的数据，然后这些多余的数据会被应用程序丢弃。这回给Mysql服务器带来额外的负担，并增加网络开销，另外也会消耗应用服务器的CPU和内存资源。

* 查询不需要的记录，最简单有效的解决方法就是在这样的查询后面加limit。
* 多表关联时返回全部的列  
   
   如果想查询所有在电影Academy Dinosaur中出现的演员，千万不要按下面这种写法查询：
   
   		SELECT * FROM sakila.actor
   		INNER JOIN sakila.film_actor USING(actor_id)
   		INNER JOIN sakila.file USING(film_id)
   		WHERE sakila.film.title = 'Academy Dinosaur';	
   	这将返回这三个表中的全部数据列。正确地方式应该是下面的：
   	
   		SELECT sakila.actor.* FROM sakila.actor ...;
   		
 * 总是取出全部列  
   
   每次看到SELECT * 的时候都要分析是不是真需要返回全部的列？取出全部的列会让优化器无法完成覆盖索引覆盖扫描的优化，还会为服务器带来额外的I/O、内存和CPU的消耗。
   
 * 重复查询相同的数据
 
 	将初次查询的数据缓存起来，需要的时候从缓存中读取，例如用户头像的URL，用户名等。 
 	
####1.2 MySQL是否在扫描额外的记录

对于mysql，最简单的衡量查询开销的三个指标如下：  
响应时间、扫描的行数、返回的行数

* 响应时间
  
  响应时间是两部分之和：服务时间和排队时间。服务时间是指数据库处理这个查询真正花了多少时间。排队时间是指服务器因为等待某些资源而没有真正执行查询的时间--可能是等I/O操作完成，也可能是等待行锁。响应时间并没有什么一致的规则或公式。
  
* 扫描的行数和返回的行数  
  
  在一定程度上能够说明该查询找到需要的数据的效率高不高。
  
* 扫描的行数和访问的类型
  
  一般mysql能够使用如下三种方式应用where条件，从好到坏依次是：
  
  * 在索引中使用where条件来过滤不匹配的记录。这是在存储引擎层完成的。
  * 使用索引覆盖查询(在Extra列中出现了Using index)来返回记录，直接从索引中过滤不需要的记录并返回命中的结果。这是在mysql的服务器中完成的，但无需再会标查询记录。
  * 从数据表中返回数据，然后过滤不满足条件的记录(在extra列中出现using where)。在服务器层完成，mysql需要先从数据表读出记录然后过滤。
  
  好的索引可以让查询使用合适的访问类型，尽可能地只扫描需要的数据行。但也并不是说增加索引就能让扫描的行数等于返回的行数。例如下面使用聚合函数count()的查询：
  
  		select actor_id,count(*) from sakila.film_actor group by actor_id;
  		
  这个查询需要读取几千行数据，但是仅返回200条结果。没有什么索引能够让这样的查询减少需要扫描的行数。
  
  如果发现查询需要扫描大量的数据但只返回少数的行，则可以尝试下面的技巧去优化：
  
  * 使用索引覆盖扫描，把所用需要用的列都放在索引中，这样存储引擎无须回表获取对应行就可以返回结果另外。
  * 改变库表结构，例如使用单独的汇总表
  * 重写这个复杂的查询。
  
###2.重构查询的方式

####2.1 一个复杂的查询还是多个简单地查询  

是否需要将一个复杂的查询分成多个简单地查询。

####2.2 切分查询  

有时候对于一个打查询我们需要“分而治之”，将大查询切分成小查询，每个查询的功能完全一样，只完成一小部分，每次只返回一小部分查询结果。

删除旧的数据就是一个很好地例子。定期的清理大量数据时，如果用一个大得语句一次完成的话，则可能需要一次锁定很多数据、占满整个事务日志、耗尽系统资源、阻塞很多小的但重要的查询。将一个大的delete语句切分成多个较小的查询可以尽可能小地影响mysql性能，同时可以减少mysql复制延迟。

	delete from messages where created < DATE_SUB(NOW(),INTERVAL 3 MONTH);
	
	可以用类似下面的办法完成同样地工作：
	row_affected = 0
	do {
		row_affected = do_query (
			"delete from messages where created < DATE_SUB(NOW(),INTERVAL 3 MONTH) LIMIT 10000"
		)
	}while row_affected >0;
	
需要注意的是：如果每次删除数据后，都暂停一会再做下一次删除，这样也可以将服务器上原本一次性的压力分散到一个很长的时间段中，就可以大大降低对服务器的影响，还可以大大减少删除时对锁的持有时间。

####2.3 分解关联查询  

很多高性能的应用都会对关联查询进行分解。例如，下面这个查询：
	
	SELECT * FROM tag
		JOIN tag_post ON tag_post.tag_id = tag.id
		JOIN post ON tag_post.post_id = post.id
	WHERE tag.tag = 'mysql';
	
可以分解成下面这些查询代替：

	SELECT * FROM tag WHERE tag = 'mysql';
	SELECT * FROM tag_post WHERE tag_id = 1234;
	SELECT * FROM post WHRER post.id in (123,456,567,9098,8904);
	
分解关联查询的方式重构查询有如下优势：

* 让缓存的效率更高
* 将查询分解后，执行单个查询可以减少锁的竞争
* 在应用成关联，可以更容易对数据进行拆分，更容易做到高性能和可扩展。
* 查询本身效率也可能会有所提升
* 可以减少冗余记录的查
* 相当于在应用中实现了哈希关联


###3. 查询执行的基础

客户端向mysql发送一个请求时，mysql是怎么做得：

1. 客户端发送一条查询给服务器。
2. 服务器先检查查询缓存，如果命中缓存，则立即返回存储在缓存中得结果。否则进入下一阶段。
3. 服务器端进行SQL解析、预处理，再由优化器生成对应的执行计划。
4. MYSQL根据优化器生成执行计划，调用存储引擎的API来执行查询。
5. 将结果返回给客户端。

####3.1 MySQL客户端/服务器通信协议  

mysql客户端和服务器之间的通信协议是“半双工”的。在任意一个时刻，要么是由服务器向客户端发送数据，要么是由客户端想服务器发送数据，这两个动作不能同时发生。

多数连接mysql的库函数都可以获得全部结果集并缓存到内存里，还可以逐行获取需要的数据。默认一般是获得全部结果集并缓存到内存中。mysql通常需要等所有的数据都已经发送到客户端才能释放这条查询所占用的资源。

下面是php连接mysql数据库的一个示例:

	<?php
		$link = mysql_connnect('localhost','user','password');
		$result = mysql_query("select * from HUGE_TABLE",$link);
		while ($row = mysql_fetch_array($result)) {
			//Do something with result.
		}
	?>
	
实际上在调用mysql_query()时，PHP就已经将整个结果集缓存到内存中，while循环只是从这个缓存中逐行的取出数据，相反的，用mysql_unbuffered_query()代替mysql_query(),PHP则不会缓存结果。

#####查询状态

对于每一个mysql连接，或者说一个线程，任何时刻都有一个状态。可以使用SHOW FUNLL PROCESSLIST(该命令返回结果中的Command列就表示当前的状态)。下面是状态值的解释：

* Sleep  
  线程正在等待客户端发送新的请求。

* Query
  线程正在执行查询或者正在将结果发送到客户端。
 
* Locked  
  在mysql服务器层，该线程正在等待表锁。在存储引擎级别实现的锁，例如InnoDB的行锁，并不会体现在线程状态中。
 
* Analyzing and statistics 
  线程正在收集存储引擎的统计信息，并生成查询的执行计划
  
* Copying to tmp table [on disk]  
  线程正在执行查询，并且将其结果集都复制到一个临时表中，这种状态一般要么在左GROUP BY操作，要么是文件排序操作，或者是union操作。如果这个状态后面还有“on disk”标记，那表示mysql正在将一个内存临时表放在磁盘上。 
  
* Sorting result  
  线程正在对结果集进行排序。
  
* Sending data
  线程可能在多个状态值之间传递数据，或者生成结果集，或者在向客户端返回数据。
  
####3.2 查询缓存

通过一个对大小写敏感的哈希查找实现的。

####3.3 查询优化处理  

查询的生命周期的下一步是将一个SQL转换成一个执行计划，MySQL再依照这个执行计划和存储引擎进行交互。这包括多个子阶段：解析SQL、预处理、优化SQL执行计划。任何错误都可能终止查询。

##### 语法解析器和预处理

mysql通过关键字将SQL语句进行解析，并生成一棵对应的“解析树”。mysql解析器将使用MySQL语法规则验证和解析查询。  
预处理器则根据一些mysql规则进一步检查解析树是否合法。  
下一步预处理器会验证权限。

##### 查询优化器

mysql使用基于成本的优化器，它将尝试预测一个查询使用某种执行计划时的成本，并选择其中成本最小的一个。可以通过查询当前会话的Last_query_cost的值来得知mysql计算的当前成本。

	select SQL_NO_CACHE COUNT(*) FROM sakila.film_actor;
	
	count(*)   5462
	
	show status like 'Last_query_cost'; 
	Last_query_cost 1040.599000
	
这表示mysql优化器认为大概需要做1040个数据页的随机查找才能完成上面的查询。这是根据一系列统计信息计算得来的：每个表或者索引的页面个数、索引的基数（索引中不同值的数量）、索引和数据行的长度、索引分布情况。优化器在评估成本的时候并不考虑任何层面的缓存，它假设读取任何数据都需要一次磁盘I/O。

有多种原因导致mysql优化器选择错误的执行计划：

* 统计信息不准确
* 执行计划中得成本估算不等同于实际执行的成本。
* mysql最有可能和你想的最优不一样
* mysql从不考虑其他并发执行的查询，这可能会影响到当前查询的速度。
* mysql也并不是任何时候都基于成本的优化
* mysql不会考虑不受其控制的操作成本

下面是一些mysql能够处理的优化类型：

* 重新定义关联表的顺序
* 将外连接转化成内连接
* 使用等价变换规则
* 优化count()、min()、max()
* 预估并转化为常数表达式
* 覆盖索引扫描
* 子查询优化
* 提前终止查询
* 等值传播
* 列表IN()的比较。

##### 数据和索引的统计信息

统计信息由存储引擎实现，不同的存储引擎可能会存储不同的统计信息。

存储引擎提供给优化器对应的统计信息包括：每个表或者索引有多少个页面、每个表的每个索引的基数是多少、数据行和索引的长度、索引的分布信息等。优化器会根据这些信息来选择一个最优的执行计划。

##### mysql是如何执行关联查询

在mysql中，每一个查询，每一个片段（包括子查询，甚至基于单表的select）都可能是关联。

mysql关联执行的策略：mysql对任何关联都执行嵌套循环关联操作，即mysql先在一个表中循环取出单条数据，然后再嵌套循环到下一个表中寻找匹配的行，直到找到所有表中匹配的行为止。然后根据各个表匹配的行，返回查询中需要的各个列。

mysql在FROM中遇到子查询时，先执行子查询并将结果放到一个临时表中。然后把这个临时表当做普通表对待。Mysql在执行union查询时也使用类似的临时表，在遇到右外连接的时候，mysql将其改写成等价的左外连接。

但是不是所有得查询都可以转化成上面的一种形式。例如全外连接（mysql不支持全外连接？？）

mysql的临时表是没有任何索引的。在编写复杂的子查询和关联查询的时候需要注意到这一点。

##### 执行计划

和很多其他关系数据库不同，mysql并不会生成查询字节码来执行查询。mysql生成查询的一颗指令树，然后通过存储引擎执行完成这棵指令树并返回结果。最终执行计划包含了重构查询的全部信息。如果对某个查询执行explain extended后，再执行show warnings，就可以看到重构出得查询。

任何夺标查询都可以使用使用一棵树表示。例如，可以按照下图执行一个四表的关联操作。

这被称为一棵平衡树。但是并不是mysql执行查询的方式。mysql总是从一个表开始一直嵌套循环、回溯完所有表关联。mysql的执行计划如下图所示，是一棵左侧深度优先的树。

##### 关联查询优化器

mysql优化器最重要的一部分就是关联查询优化，它决定了多个表关联的顺序。通常多表关联的时候，可以有多种不同的关联顺序来获得相同的执行结果。关联查询优化器则通过评估不同顺序时的成本来选择一个代价最小的关联顺序。  

下面的查询语句可以通过不同顺序关联最后都获得相同的结果：

	SELECT film.film_id,film.title,film.release_year,actor.actor_id,
	    actor.first_name,actor.last_name
	    FROM sakila.film
	    INNOR JOIN sakila.film_actor USING(film_id)
	    INNOR JOIN sakila.actor USING(actor_id);
	    
可以用explain查看mysql是如何执行这个计划的。

使用STRAIGHT_JOIN关键字，就会按照所写语句的顺序执行。

严格的来说，mysql并不是根据读取记录来选择最优的执行计划。实际上，mysql通过预估需要读取的数据页来选择，读取的数据页越少越好。不过读取的记录数通常能够很好地反映一个查询的成本。

可以通过Last_query_cost查看预估成本。

重新定义关联的顺序是优化器非常重要的一部分功能。不过有时候，优化器给出的并不是最优的关联顺序。

如果有超过n个表的关联，那么需要检查n的阶乘种关联的顺序。我们称之为所有可能的执行计划的“搜索空间”，搜索空间的增长速度非常快。当搜索空间非常大得时候，优化器不可能逐一评估每一种关联顺序的成本。这时，优化器选择“贪婪”的搜索方式查找“最优”的关联顺序。实际上，当需要关联的表超过optimizer_search_depath的限制的时候，就会选择“贪婪”搜索模式了（optimizer_search_depath参数可以根据需要指定大小）。

##### 排序优化

排序的成本很高，从性能的角度考虑，应尽可能避免排序或者尽可能避免对大量数据进行排序。

当不能使用索引生成排序结果时，mysql需要自己进行排序，如果数据量小则在内存中进行，如果数据量大，则需要使用磁盘，不过mysql将这个过程统一称为文件排序(filesort),即完全是内存排序不需要任何磁盘文件时也是如此。

mysql使用两种排序算法：

* 两次传输排序（旧版本中使用）  
  读取行指针和需要排序的字段，对其进行排序，然后再根据排序结果读取所需要的数据行。
* 单次传输排序（新版本中使用）  
  先读取查询所需要的所有列没然后再根据给定列进行排序，最后直接返回排序结果。（4.1）
  
mysql在进行文件排序的时候需要使用的临时存储空间可能会比想象的要大得多。因为mysql在排序时，对每一个排序记录都分配一个足够长的定长空间来存放。这个定长空间必须足够长足以容纳其中最长的字符串。例如：varchar列需要分配其完整长度；如果使用utf-8字符集，那么mysql将会为每个字符预留三个字节。

在关联查询的时候如果需要排序，mysql会分两种情况处理这样的文件排序：

* order by 字句中得所有列都来自关联的第一个表，那么mysql在关联处理第一张表时就进行文件排序，explain的extra字段会有using filesort.
* mysql 都会先将关联的结果放到一个临时表中，然后在所有的关联结束后，再进行文件排序。explain的extra字段为 “Using temporary; Using filesort”。如果加limit也会在排序后应用。

即使需要返回较少的数据，临时表和排序的数据量仍然会非常大。

####3.4 查询执行引擎

mysql只是简单地根据执行计划给出的指令逐步执行。

####3.5 返回结果给客户端

查询执行的最后一个阶段是将结果返回给客户端。  
如果查询可以被缓存，那么mysql在这个阶段也会将结果存放到查询返回中。

###4 Mysql的查询优化器的局限性  

####4.1 关联子查询

mysql的子查询实现的非常糟糕。最糟糕的一类查询时where条件中包含in()的子查询语句。例如，如果我们希望找到sakila数据库中，演员Penelope Guiness（他的actor_id为1）参演过的所有影片信息。很显然，我们会用下列子查询语句：

	SELECT * from sakila.film
	WHERE film_id IN (
		SELECT film_id FROM sakila.film_actor WHERE actor_id = 1);
		
一般我们会认为上面的查询是怎么运行的：

	SELECT GROUPA_CONCAT(film_id) FROM sakila.film_actor WHERE actor_id = 1;
	--Result:1,23,25,106,140,166,277
	SELECT * FROM sakila.film
	WHERE film_id
	IN (1,23,25,106,140,166,277);
	
通过explain extended查看这个sql语句被改成什么，发现它与我们预期的不一致。
可以用下列的方法优化：

	SELECT film.* FROM sakila.film 
		INNER JOIN sakila.film_actor USING(film_id)
	WHERE actor_id = 1;

另外一个方法是使用函数GROUP_CONCAT()在IN()构造一个由逗号分隔的列表，有时候比上面使用关联的还要快。IN()子查询的效率通常非常糟糕。建议使用EXISTS()等效的改写查询来获取更好地效率。  

	SELECT * FROM sakila.film
	WHERE EXISTS(
		SELECT * FROM sakila.film_actor WHERE actor_id = 1
		AND film_actor.film_id = film.film_id);


####4.2 UNION的限制

如果希望UNION的各个字句能够根据limit只取部分结果集，或者希望能够先排好顺序再合并结果集的话，就需要在UNION的各个字句中分别使用这些子句。例如想将两个子查询结果联合起来，然后取前面20条记录，那么mysql会将两张表都存放到同一个临时表中，然后再取前20行记录。

	(select first_name,last_name
	 from sakila.actor
	 order by last_name)
	 union all
	(select first_name,last_name
	from sakila.customer
	order by last_name)
	limit 20;
	
 这条查询将会把actor中的200条记录和customer表中得599条记录存放在一个临时表中，然后再从临时表中取出前20条记录。可以通过在UNION的两个子查询中分别加上limit 20 来减少临时表中得数据：
 
	(select first_name,last_name
	 from sakila.actor
	 order by last_name
	 limit 20)
	 union all
	(select first_name,last_name
	from sakila.customer
	order by last_name
	limit 20)
	limit 20;
 	
 要注意一点：从临时表中取出数据的顺序并不是一定的。
 
####4.3 索引合并优化

####4.4 等值传递

等值传递会带来意想不到的额外消耗。例如一个非常大得IN()列表，而mysql优化器发现存在where、on或者using的子句，这个列表的值和另外一个表的列相关联。

####4.5 并行执行

mysql无法利用多核特性来并行执行查询。

####4.6 哈希关联

mysql并不支持哈希关联，mysql的所有关联都是嵌套循环关联。不过可以建立一个哈希索引曲线的实现哈希关联。memory存储引擎，索引是哈希索引。mariaDB已经实现了真正的哈希关联。

####4.7 松散索引扫描

####4.8  最大值和最小值优化

####4.9 在同一个表上查询和更新

mysql不允许对同一张表同时进行查询和更新。

	update tbl as outer_tbl
	   set cnt = (
	   		select count(*) from tbl as inner_tbl
	   		where inner_tbl.type = outer_tbl.type
	   );
	
这条sql语句不会执行，改成下面这种形式：

	update tbl 
		inner join(
			select type,count(*) as cnt
			from tbl
			group by type
		) as der using(type)
	set tbl.cnt = der.cnt;
	
###5 查询优化器提示

###6 优化特定查询

####6.1 优化count()查询

count()是一个特殊的行数，有两种不同的作用：可以统计某个列值的数量，也可以统计行数。

在统计列值时要求列值是非空的（不统计NULL）。如果在count()的括号中指定了列或者列的表达式，则统计的是这个表达式的结果数；

使用count(\*)统计行数时，这种情况下通配符 * 并不会想我们猜想的那样扩展成所有列。实际上，它会忽略所有列而直接统计所有的行数。MyISAM的count()总是非常快，但是是由前提的，只有没有任何where条件的count(\*)才会非常快。

#####简单地优化

使用标准数据库world来看看如何快速查找到所有ID大于5的城市，一般会如下：

	 select count(*) from world.city where ID > 5;
	 
通过show status的结果可以看到该查询需要扫描4097行数据。如果条件反转一下，先查找ID小于等于5的城市数，然后用总城市数一减就能得到同样地结果，却可以将扫描的结果减少到5行以内。

	select (select count(*) from world.city) - count(*)
	from world.city where ID <= 5;
	
如何在同一个查询中统计同一个列的不同值的数量，以减少查询的语句量。

	select sum(if(color = 'blue',1,0)) as blue,sum(if(color = 'red',1,0))
	as red from items;
	
也可以使用count()而不是sum()实现同样地目的，只需要将满足条件设置为真，不满足条件设置为NULL即可：

	select count(color='blue' or NULL) as blue,count(color='red' or NULL)
	as red from items;

#####使用近似值

explain出来的优化器估算的行数就是一个不错的近似值。

#####更复杂的优化

增加汇总表，使用类似memcached这样的外部缓存系统。

####6.2 优化关联查询 

* 确保ON或者USING子句中的列上有索引
* 确保任何的group by 和order by中表达式只涉及到一个表中得列，这样mysql才有可能使用索引来优化这个过程。
* 当升级mysql的时候注意：关联语法、运算符优先级等其他可能会发生变化的地方，因为以前普通关联的地方可能会变成笛卡尔积。

####6.3 优化子查询

####6.4 优化Group By 和distinct

当无法使用索引时，group by使用两种策略完成：使用临时表或者文件排序来做分组。可以使用SQL_BIG_RESULT 和SQL_SMALL_RESULT来让优化器按照你希望的方式运行。  

如果需要对关联表查询做分组，并且是按照查找表中的某个列进行分组，那么通常采用查找表的标识列分组的效率会比其他列高。例如下面的查询的效率就不会很好：

	select actor.first_name, actor.last_name, count(*)
	from sakila.film_actor
	inner join sakila.actor using(actor_id)
	group by actor.first_name,actor.last_name;
	
如果按照下列方式的话效率会更高：

	select actor.first_name, actor.last_name,count(*)
	from sakila.film_actor
	inner join sakila.actor using(actor_id)
	group by film_actor.actor_id;
	
如果没有通过order by子句显示地指定排序列，当查询使用group by子句的时候，结果集会自动按照分组的字段进行排序，如果不关心结果集的排序，而这种默认排序又导致了需要文件排序，则可以使用order by null,让mysql不再进行文件排序。也可以在group by子句中直接使用DESC和ASC关键字，使分组的结果集按需要的方向排序。

#####优化group by with rollup

分组查询的一个变种就是要求mysql对返回的分组结果再做一次超级聚合。可以使用with rollup子句来实现这种逻辑，但可能不够优化。可以使用子查询或临时表，或者转移到应用程序中处理。

####6.5 优化limit分页


####6.6 优化UNION查询

mysql总是通过创建并填充临时表的方式来执行union查询。很多策略在union查询中没法很好的使用。  

除非确实需要服务器消除重复的行，否则就一定要使用UNION ALL。如果没有ALL关键字，mysql会给临时表加上DISTINCT选项，这会导致对这个临时表的数据做唯一性检查。事实上，mysql总是将结果集放入临时表，然后再读出，再返回给客户端。

####6.7 静态查询分析

percona Toolkit中的pt-query-advisor能够解析查询日志、分析查询模式，然后给出所有可能存在潜在问题的查询，并给出足够详细的建议。

####6.8 使用用户自定义的变量

用户自定义变量是一个用来存储内容的临时容器，在连接mysql的整个过程都存在。可以使用下面的set和select语句来定义它们：

	set @one := 1;
	set @min_actor := (select min(actor_id) from sakila.actor);
	set @last_work := CURRENT_DATE-INTERVAL 1 WEEK;
	
然后在任何可以使用表达式的地方使用这些自定义的变量：

	select ... where col <= @last_week;
	
哪些变量不能使用用户自定义变量：

* 使用自定义变量的查询，无法使用查询缓存。
* 不能在使用常量或者标识符的地方使用自定义变量，例如表名、列名和limit子句中。
* 用户自定义变量的生命周期是在一个连接中有效，所以不能用它们来做连接间的通信。
* 如果使用连接池或者持久化连接，自定义变量可能让看起来毫无关系的代码发生交互。
* 在5.0之前的版本，是大小写敏感的。所以要注意代码在不同mysql版本间的兼容性。
* 不能显示的声明自定义变量的类型。是一个动态类型。
* mysql优化器在某些场景下可能会将这些变量优化掉。
* 赋值的顺序和赋值的时间并不是固定的，这依赖于优化器的决定。
* 赋值符号:=的优先级非常低，所以需要注意，赋值表达式应该使用明确地括号。
* 使用未定义的变量不会产生任何语法错误，不利于纠错

#####优化排名语句

实现“行号”功能

	set @rownum := 0;
	select actor_id,@rownum := @rownum +1 as rownum
	from sakila.actor limit 3;

我们编写一个查询获取演过最多电影的前10位演员，然后根据他们的出演电影次数做一个排名，如果出演的电影数量一样，则排名相同。

首先编写一个查询，返回每个演员参演电影的数量：

	select actor_id,count(*) as cnt
	from sakila.film_actor
	group by actor_id 
	order by cnt desc
	limit 10;
	
现在我们再把排名加上：

	set @curr_cnt := 0, @prev_cnt := 0,@rank := 0;
	select actor_id,
		@curr_cnt := count(*) as cnt,
		@rank := if(@prev_cnt <> @curr_cnt,@rank+1,@rank) as rank,
		@prev_cnt := @curr_cnt as dummy
	from sakila.film_actor
	group by actor_id
	order by cnt desc
	limit 10;
	
通过explain extended了解可能是由于变量赋值的赋值时间和我们预料的不同。  
另一个解决方案是在from字句中使用子查询生成一个中间的临时表

	set @curr_cnt := 0 , @prev_cnt := 0 , @rank := 0;
	select weibo_uid,
		@curr_cnt   := cnt as cnt,
		@rank       := if(@prev_cnt <> @curr_cnt, @rank +1 ,@rank) as rank,
		@prev_cnt   := @curr_cnt dummy
	from (
		select weibo_uid,count(*) as cnt
		from wedaily_weibo
		group by weibo_uid
    	order by cnt DESC
    	limit 30
	) as der;

##### 避免重复查询刚刚更新的数据

能够更高效地更新一条记录的时间戳，同时希望查询当前记录中存放的时间戳是什么，

	 update t1 set lastUpdated = NOW() where id = 1;
	 select lastUpdated from t1 where id = 1;
	 
使用了变量后，我们可以按如下方式重写查询：

	update t1 set lastUpdated = NOW() where id = 1 and @now := NOW();
	select @now;

##### 统计更新和插入的数量

	insert into t1(c1,c2) values(4,4),(2,1),(3,1)
	on duplicate key update
		c1 = values(c1) + (0 * (@x := @x +1));
		
##### 确定取值的顺序  

使用用户自定义变量的一个常见问题就是没有注意到在赋值和读取变量的时候可能是在查询的不同阶段。例如，在select字句中进行赋值然后在where子句中读取变量，则可能并不如你所想。

	set @rownum := 0;
	select actor_id,@rownum := @rownum + 1 as cnt
	fro sakila.actor
	where @rownum <= 1;
	
事实上这里查询了两条数据，因为where和select是查询执行的不同阶段被执行的。如果在查询中加入order by的话，结果可能会更不同。

	set @rownum := 0;
	select actor_id,@rownum := @rownum + 1 as cnt
	fro sakila.actor
	where @rownum <= 1
	order by first_name;

order by 引入了文件排序，而where条件在文件排序操作前取值的，所以这个查询会返回表中的全部记录。解决这个问题的办法是让变量的赋值和取值发生在执行查询的同一个阶段：

	set @rownum := 0;
	select actor_id,@rownum as rownum
	from sakila.actor
	where (@rownum := @rownum + 1) <= 1;
	
##### 编写偷懒的UNION

假设需要编写一个union查询，其第一个子查询作为分支条件先执行，如果找到了匹配的行，则跳过第二分支。

下面的查询会再两个地方查找一个用户--- 一个主用户表、一个长时间不活跃的用户表，不活跃用户表的目的是位了实现更高效的归档：

	select id from users where id =123
	union all
	select id from users_archived where id = 123;
	
上面的查询时可以正常工作的，但是即使在users表中已经找到了记录，上面的查询还是回去归档表users_archived中再查找一次。我们希望只有当第一张没有数据时，才在第二张表中查询。定义一个@found,我们通过在结果列中做一次赋值来实现，然后将赋值放在函数GREATEST中来避免返回额外的数据。为了明确我们的结果到底来自哪个表，我们新增了一个包含表名的列。最后我们需要在查询的末尾将变量重置为null，这样保证遍历时不干扰后面的结果。

	select GREATEST(@found := -1,id) as id, 'users' as which_tbl
	from users where id = 1
	union all 
	select id,'users_archived'
	from users_archived where id = 1 and @found is null
	union all
	select 1,'reset' from DUAL where (@found := NULL) IS NOT NULL
	   


   