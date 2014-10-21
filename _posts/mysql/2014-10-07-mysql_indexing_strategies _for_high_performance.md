---
layout: post  
title: "mysql高性能索引策略"
description: ""
category: 读书笔记--高性能mysql
tags: [高性能mysql,mysql,index]
---
{% include JB/setup %}
# mysql高性能的索引策略
---


### 1.独立的列

&emsp;&emsp;索引列不能是表达式的一部分，也不能是函数的参数。  

	select actor_id from sakila.actor where actor_id + 1 = 5;  不能使用索引
	select actor_id from sakila.actor where actor_id = 4;   能使用索引。
	
### 2.前缀索引和索引的选择性

&emsp;&emsp;需要索引很长的字符列，这会让索引变得大且慢。第一种是模拟哈希索引，第二种做法是可以索引开始的部分字符，这样可以大大节约索引的空间，从而提高索引效率，但是会降低索引的选择性。

&emsp;&emsp;**索引的选择性：**不重复的索引值和数据表的记录总数(#T)的比值，范围从1/#T到1之间。索引的选择性越高则查询效率越高，因为选择性高的索引可以让mysql在查找时过滤掉更多行。唯一索引的选择性是1，这是最好的索引选择性，性能也是最好的。

&emsp;&emsp;对于BLOB，TEXT或者很长的varchar类型的列，必须使用前缀索引。

&emsp;&emsp;计算合适的前缀长度的另外一个办法就是计算完整列的选择性，并使前缀的选择性接近完整列的选择性。计算完整列的选择性：

	select count(DISTICT city)/count(*) from sakila.city_demo;
	
	select count(DISTICT left(city,3))/count(*) as sel3,
	       count(DISTICT left(city,4))/count(*) as sel4,
	       count(DISTICT left(city,5))/count(*) as sel5,
	       count(DISTICT left(city,6))/count(*) as sel6,
	       count(DISTICT left(city,7))/count(*) as sel7
	from sakila.city_demo;
	
&emsp;&emsp;前缀索引是一种能使索引更小、更快的有效方法，但另一方面也有其缺点：mysql无法使用前缀索引做order by 和 group by，也无法是使用前缀索引做覆盖扫描。


### 3.多列索引

&emsp;&emsp;在多个列上建立一个独立的单列索引大部分情况下并不能
提高Mysql的查询性能。mysql5.0引入了一种叫“索引合并”的策略。
&emsp;&emsp;例如表film_actor在字段film_id和actor_id上各有一个单列索引。但是对于下面这个查询where条件，这两个单列索引都不是好的选择：

	select film_id,actor_id from sakila.file_actor where actor_id=5 or film_id=1;
	
&emsp;&emsp;在老的Mysql版本中，mysql对这个查询会使用全表扫描。除非改写成如下的两个查询union的方式：

	select film_id,actor_id from sakila.file_actor where actor_id = 1
	union all
	select film_id,actor_id from sakila.file_actor where film_id = 1 and actor_id <> 1;
	
&emsp;&emsp;在mysql5.0和更新版本中，查询能够同时使用这两个单列索引进行扫描，并将结果进行合并。

&emsp;&emsp;索引合并策略有时候是一种优化的结果，但实际上更多时候说明了表上得索引建得很糟糕：

* 当出现服务器对多个索引做相交操作时（通常有多个and条件），通常意味着需要一个包含所有相关列的多列索引，而不是多个独立的单列索引。
* 当服务器需要对多个索引做联合操作时（通常有多个or条件），通常需要耗费大量的CPU和内存资源在算法的缓存、排序和合并操作上。

&emsp;&emsp;如果在explain中看到有索引合并，应该好好检查一下查询和表的结构，看是不是最优的。

### 4.选择合适的索引列顺序

将选择性最高的列放到索引最前列。

### 5.聚簇索引

聚簇索引并不是一种单独的索引类型，而是一种数据存储方式。InnoDB的聚簇索引实际上在同一个结构中保存了B-Tree索引和数据行。  
当表有聚簇索引时，它的数据行实际上存放在索引的叶子页中。一个表只能有一个聚簇索引。  
InnoDB主要通过主键聚集数据。  
如果没有定义主键，InnoDB会选择一个唯一的非空索引代替。如果没有这样的索引InnoDB会隐式定义一个主键来作为聚簇索引。InnoDB只聚集在同一个页面中的记录。包含相邻键值的页面可能会相距甚远。  

聚簇索引的优点：

* 可以把相关数据保存在一起。
* 数据访问更快。聚簇索引将索引和数据保存在同一个B-Tree中，因此从聚簇索引中获取数据通常比非聚簇索引中查找要快。
* 使用覆盖索引扫描的查询可以直接使用页节点中的主键值。

聚簇索引的缺点：

* 聚簇数据最大限度地提高了I/O密集型应用的性能，但如果数据全部都放在内存中，则访问的顺序就没那么重要了，聚簇索引也就没什么优势了。
* 插入速度严重依赖于插入顺序。如果不是按照主键顺序加载数据，那么在加载完后最好使用optimize table命令重新组织一下表。  
* 更新聚簇索引列的代价很高，因为会强制InnoDB将每个被更新的行移动到新的位置。
* 基于聚簇索引列的表在插入新行，或者主键被更新导致需要移动行的时候，可能会面临“页分裂”的问题。
* 聚簇索引可能会导致全表扫描变慢，尤其是行比较稀疏，或者由于页分裂导致数据存储不连续的时候。
* 二级索引（非聚簇索引）可能比想象的要大，因为在二级索引的叶子节点包含了引用行的主键列。
* 二级索引访问需要两次索引查找，而不是一次。（二级索引叶子节点保存的不是指向行的物理位置的指针，而是行的主键值）。

避免使用随机的（不连续且值的分布范围非常大）的聚簇索引。（例如使用UUID来作为聚簇索引会很糟糕：它使得聚簇索引的插入变得完全随机）。  

完全随机的的聚簇索引的缺点：

* 写入的目标页可能已经刷到磁盘上并从缓存中移除，或者是还没有被加载到缓存中，InnoDB在插入之前不得不先找到并从磁盘读取目标页到内存中。这导致大量的随机I/O。
* 因为写入是乱序的，InnoDB不得不频繁地做页分裂操作，以便为新的行分配空间。页分裂会导致移动大量数据，一次插入最少需要修改三个页面而不是一个页。
* 由于频繁的页分裂，页会变得稀疏并被不规则的填充，最终数据会有碎片。

在把这些随机值载入到聚簇索引以后，也许需要做一次optimize table 来重建表并优化页的填充。

使用InnoDB时应该尽可能地按主键顺序插入数据，并且尽可能地使用单调增加的聚簇键的值来插入新行。

### 6.覆盖索引

一个索引包含（覆盖）所有查询的字段的值被称为覆盖索引。

覆盖索引的好处：   

*  索引条目通常远小于数据行大，所以如果只需要读取索引，那mysql就会极大地减少数据访问量。  
*  因为索引是按照列顺序存储的，所以对I/O密集型的范围查询会比随机从磁盘读取每一行数据的I/O要少得多。  
*  由于InnoDB的聚簇索引，覆盖索引对InnoDB表特别有用。


覆盖索引必须要存储索引列的值，而哈希索引、空间索引和全文索引等都不存储索引列的值，索引mysql只能使用B-Tree索引做覆盖索引

当发起一个被索引覆盖的查询时，在EXPLAIN的Extra列可以看大“Using index ”的信息，就是使用了覆盖索引。

例如：表sakila.inventory有一个多列索引(store_id,film_id)。mysql如果只需访问这两列，就可以使用这个索引做覆盖索引。

	 explain select store_id,film_id from sakila/inventory\G
	 
索引覆盖查询还有很多陷阱可能会导致无法实现优化。Mysql查询优化器会在执行查询前判断是否有一个索引能进行覆盖。假设索引覆盖了where条件中的字段，但不是整个查询涉及的字段。如果条件为假（false），Mysql5.5和更早的版本会回表获得数据行，尽管并不需要这一行且最终会被过滤掉。  

	explain select * from products where actor='SEAN CARREY' AND title like '%APOLLO%'\G
	
这里索引无法覆盖该查询，有两个原因：

* 没有任何索引能够覆盖这个查询。
* MySql不能在索引中这行like操作。

有一个巧妙的方法解决上述问题，先将索引扩展至覆盖三个数据列(artist,title,prod_id)，按照下面的方式重写查询。

	explain select * 
	from products
	    join(
	    	select prod_id
	    	from products
	    	where actor='SEAN CARREY' AND title like '%APOLLO%'
	    ) as t1 on (t1.prod_id=products.prod_id)\G

我们把这种方式叫做延迟关联，因为延迟了对列的访问。


### 7.使用索引扫描来做排序  

Mysql有两种方式可以生成有序的结果：通过排序操作；或者按索引顺序扫描。如果explain处理的type列的值为“index”，则说明mysql使用了索引扫描来排序。  
只有当索引的列顺序和order by自居的顺序完全一致，并且所有列的排序方向（倒序或者正序）都一样时，mysql才能使用索引对结果做排序。如果查询需要关联多张表，则只有当order by字句引用的字段全部为第一个表时，才能使用索引做排序。  
order by字句和查找型查询的限制是一样的：需要满足索引的最左前缀的要求。  
有一种情况下order by字句可以不满足索引的最左前缀的要求，就是前导列位常量的时候。如果where字句或者order by字句中对这些列指定了常量。就可以“弥补”索引的不足。  

例如：sakila示例数据库的表rental在列(rental_date,inventory_id,customer_id)上有名为rental_date的索引。  

	explain select rental_id,staff_id from sakila.rental
	where rental_date = '2005-05-25'
	order by inventory_id,customer_id\G
	
没有出现文件排序（filesort）操作。（索引的第一列被指定为一个常数）  

下面是一些不能使用索引做排序的查询：

* 使用了两种不同的排序方向，但是索引列都是正向排序的：  

		... where rental_date = '2005-05-25' order by inventory_id DESC,customer_id ASC;
		
* order by 字句中引用了一个不在索引中的列：

		... where rental_date = '2005-05-25' order by inventory_id,staff_id;
		
* 在索引列的第一列上是范围条件，索引Mysql无法使用索引的其余列：

		... where rental_date > '2005-05-25' order by inventory_id,customer_id;
		
* 在inventory_id列有多个等于条件。对于排序来说，也是一种范围查询

		... where rental_date = '2005-05-25' and inventory_id in(1,2) order by customer_id;  
		
### 8.压缩（前缀压缩）索引  

MyISAM使用前缀压缩来减少索引的大小，从而让更多地索引可以放入内存中，这在某些情况下能极大地提高性能。默认只压缩字符串，但通过参数设置也可以对整数进行压缩。可以在create table 时指定PACK_KEYS参数来控制索引压缩的方式。  

### 9.冗余和重复索引

mysql允许在相同的列上创建多个索引。  
重复索引是指在相同的列上按照相同的顺序创建的相同类型的索引。应该避免这样创建的重复索引，发现以后也应该立即删除。  
表中的索引越多插入速度会变慢。一般来说，增加索引将会导致insert、update、delete等操作的速度变慢，特别是当新增索引后导致达到了内存瓶颈的时候。

解决冗余索引和重复索引的方法很简单，删除这些索引就可以了。  

* 写一些复杂的访问INFORMATION_SCHEMA表来查询。
* 可使用Shlomi Noach 的common_schema中的一些视图来定位，common_schema 是一系列可以安装到服务器上的常用的存储和视图(http://code.googele.com/p/common-schema)
* percona toolkit中的pt-duplicate-key-checker,该工具通过分析表结构找出冗余和重复的索引。  
* 使用Percona工具箱中的pt-upgrade工具来仔细检查计划中得索引变更。

### 10.未使用的索引  

下面有两个工具帮助定位未使用的索引：

* 在Percona Server或者MariaDB中先打开userstates服务器变量（默认是关闭的），然后让服务器正常运行一段时间，再通过查询INFORMATION_SCHEMA.INDEX_STATISTICS就可以查到每一个索引的使用频率。  
* 可以使用Percona Toolkit中的pt-index-usage，该工具可以读取查询日志，并且对日志中的每条查询进行explain操作，然后打印出关于索引和查询的报告。

### 11.索引和锁

索引可以让查询锁定更少的行。虽然innodb的行锁效率很高，内存使用也很少，但是锁定行的时候仍然会带来额外的开销；其次：锁定超过需要的行会增加锁争用并减少并发性。   

explain的extra类出现“using where”，表示mysql服务器将存储引擎返回行以后再应用where过滤条件。

即使使用了索引，InnoDB也可能锁住一些不需要的数据。如果不能使用索引查找和锁定行的话问题可能会更糟糕，mysql会做全表扫描并锁定住所有的行，而不管是不是需要。  
InnoDB在二级索引上使用共享（读）锁，但访问主键索引需要排他（写）锁。这消除了使用覆盖索引的可能性，并且使得select for update比lock in share mode或非锁定查询要慢很多。


 









	
