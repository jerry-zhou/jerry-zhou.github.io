---
layout: post  
title: "哈希索引"
description: ""
category : 读书笔记--高性能mysql
tags: [hash index,mysql,高性能mysql] 
---
{% include JB/setup %}
# 哈希索引
---


&emsp;&emsp;哈希索引是（hash index）基于哈希表实现，只有精确匹配索引的所有列的查询才有效。哈希索引将所有的哈希码存储在索引中，同时在哈希表中保存指向每个数据行的指针。

&emsp;&emsp;在mysql中，只用Memory引擎显示支持哈希索引。这也是Memory引擎表默认索引类型。Memory 引擎同时也支持B-Tree索引。Memory是支持非唯一哈希索引的。如果多个列的哈希值相同，索引会以链表的方式存放多个纪录指针到同一个哈希条目中。

	creat table testhash (
	    fname varchar(50) not null,
	    lname varchar(50) not null,
	    key using hash(fname)
	) ENGINE = MEMORY;
	
&emsp;&emsp;哈希索引的优点：  
&emsp;&emsp;索引自身只需要存储对应的哈希值，所以索引的结构十分紧凑，这也让哈希索引查找非常快。  

&emsp;&emsp;哈希索引的缺点：

* 哈希索引只包含哈希值和行指针，而不存储字段值，所以不能使用索引中的值来避免读取行。
* 哈希索引数据并不是按照索引顺序存储的，所以也就无法用于排序。
* 哈希索引不支持部分索引列匹配查找，因为哈希索引始终是使用索引列的全部内容来计算哈希值的。例如，在数据列(A,B)上建立哈希索引，如果查询只有数据列A，则无法使用该索引。
* 哈希索引只支持等值比较查询，包括=、in()、<=>.也不支持任何范围查询，例如Where price > 100。
* 访问哈希索引的数据非常快，除非有很多哈希冲突。当出现哈希冲突的时候，存储引擎必须遍历链表中所有的行指针，逐行进行比较，直到找到所有符合条件的行。
* 如果哈希冲突很多的话，一些索引维护操作的代价也会很高。

除了Memory引擎外，NDB集群引擎也支持唯一哈希索引。

InnoDB引擎有一种特殊的功能叫做“自适应哈希索引”。当InnoDB注意到某些索引值被用得非常频繁时，它会在内存中基于B-tree索引之上再创建一个哈希索引。这是一个完全自动的，内部的行为，用户无法控制或者配置，不过如果有必要，完全可以关闭该功能。

创建自定义的哈希索引:

下面是一个实例，例如需要存储大量的URL，并需要根据URL进行搜索查找。如果使用B-tree存储URL，存储的内容就会非常大，因为URL本身 很长。正常情况下会有如下查询：

	select id from url where url = "http://www.mysql.com";
	
若删除原来URL列上的索引，而新增一个被索引的url_crc列，使用crc32做哈希，就可以使用下面的方式查询：

	select id from url where url = "http://www.mysql.com" and url = crc32("http://www.mysql.com")
	
这样做得缺陷是需要维护哈希值，可以手动维护，也可以使用触发器实现。

创建表：

	create table pseudohash (
		id  int unsigned not null auto_increment,
		url varchar(255) not null,
		url_crc int unsigned not null default 0,
		primary key(id)
	)
	
然后创建触发器。

	DELIMITER //
	
	CREATE TRIGGER pseudohash_crc_ins BEFORE INSERT ON pseudohash FOR EACH ROW BEGIN SET NEW.url_crc = crc32(NEW.url);
	END;
	//
	
	CREATE TRIGGER pseudohash_crc_upd BEFORE UPDATE ON pseudohash FOR EACH ROW BEGIN SET NEW.url_crc = crc32(NEW.url);
	END;
	//
	
	DELIMITER ;
	

如果数据表非常大，CRC32()会出现大量的哈希冲突，则可以考虑自己实现一个简单的64位哈希函数。这个自定义函数要返回整数，而不是字符串。下面有一种解决方案：

	select conv(right(md5('http://www.mysql.com'),16),16,10) as HASH64;
	
处理哈希冲突，必须在where字句中包含常量值。

	select word,crc from words where cc=crc32('gnu') and word='gnu';