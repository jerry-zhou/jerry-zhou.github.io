---
layout: post  
title: "加快ALTER TABLE操作的速度"
description: ""
category: 读书笔记--高性能mysql
tags: [alter table]
---
{% include JB/setup %}
# 加快ALTER TABLE操作的速度
---


  mysql的ALTER TABLE 操作的性能对大表来说是个很大的性能问题。Mysql执行大部分修改表结构操作的方法是用新的表结构创建一个新表，从旧表中查出所有的数据插入新表，然后删除旧表。

   一般而言，大部分的ALTER TABLE操作将导致mysql服务中断。对常见的场景，能使用的技巧只有两种：一种是现在一台不提供服务的机器上执行alter TABLE操作，然后和提供服务的主库进行切换；另外一种技巧是“影子拷贝”。影子拷贝的技巧是用要求的表结构创建一张于源表无关的新表，然后通过重命名和删表操作交换两张表。
   
   不是所有的alter TABLE操作都会引起表重建。例如：有两种方法可以改变或者删除一个列的默认值（一种方法很快，另外一种则很慢）。假设要修改电影的默认租赁期限，从三天改到五天。下面一种方式很慢：

	ALTER TABLE sakila.film  
	MODIFY COLUMN rental_duration TINYINT(3) NOT NULL DEFAULT 5;
	
  它拷贝了整张表到一张新表，甚至表的类型、大小和是否为NULL属性都没有改变。  
  
  mysql可以跳过创建新表的步骤。列的默认值实际上存在表的.frm文件中，所以可以直接修改这个文件而不需要创建表的本身。然而mysql还没有采用这种优化的方法，所有modify column操作都将导致表 重建。  
  
  另外一种方法是通过alter column操作来改变列的默认值：
	
	ALTER TABLE sakila.film
	ALTER COLUMN rental_duration SET DEFAULT 5;
  
这个语句会直接修改.frm文件而不涉及表数据。所以，这个操作是非常快的。


####  只修改.frm文件  

下面的这些操作是有可能不需要重建表的：
  
*   移除（不是增加）一个列的AUTO_INCREMENT属性。  
*   增加、移除，或更改enum和set常量。如果移除的是已经有行数据到其值的常量，查询将会返回一个空字符串。 

基本的技术是为想要的表结构创建一个新的.frm文件，然后用它替换掉已经存在的那张表的.frm文件：

1. 创建一张有相同结构的空表，并进行所需要的修改（例如增加ENUM常量）  
2. 执行FLUSH TAABLES WITH READ LOCK。这将会关闭所有正在使用的表，并且禁止任何表被打开。
3. 交换.frm文件。
4. 执行UNLOCK TABLES来释放第2步中的读锁。

下面给sakia.film表的rating列增减一个常量为例来说明：

	SHOW COLUMNS FROM sakia.film LIKE "rating";
	
rating ： enum('G','PG','PG-13','R','PG-17') 

假设我们需要为那些对电影更加谨慎地父母们添加一个PG-14的电影分级：  

	CREATE TBALE sakia.film_new LIKE sakila.film;  
	ALTER TABLE sakia.film_new
	MODIFY COLUMN rating ENUM('G','PG','PG-13','R','NC-17,','PG-14') DEFAULT 'G';
	FLUSH TABLES WITH READ LOCK;
	
如果把新增值放在中间。例如PG-13之后，则会导致已经存在的数据的含义被改变：已经沉溺在的R值将会改变成PG-14,而已经存在的NC-17将成为R。  

接下来用操作系统的命令交换.frm文件：

	/var/lib/mysql/sakila# mv film.frm film_tmp.frm
	/var/lib/mysql/sakila# mv film_new.frm film.frm 
	/var/lib/mysql/sakila# mv film_tmp.frm film_new.frm
	
再回到mysql命令行，现在可以解锁表并且看到变更后的效果了：

	UNLOCK TABLES;
	SHOW COLUMNS FROM sakila.film LIKE 'rating'\G
	
最后需要做的是删除为完成这个操作而创建的辅助表：

	DROP TABLE sakila.film_new;
	
#### 快速创建MyISAM索引  

为了高效地载入数据到MyISAM表中，有一个常用的技巧是先禁用索引、载入数据，然后再重新启用索引：

	ALTER TBALE test.load_data DISABLE KEYS;
	---load the data
	ALTER TABLE test.load_data ENABLE KEYS;  
	
这样做会快很多，并且使得索引树的碎片更少，更紧凑。   

不幸的是，这个办法对唯一索引无效，因为DISABLE KEYS只对非唯一索引有效。myisam会在内存中构建唯一索引，并且为载入的每一行检查唯一性。一旦索引的大小超过了有效内存的大小，载入操作就会变得越来越慢。

**操作之前一定要先备份数据**  

下面是操作步骤：  

1.用需要的表结构创建一张表，但是不包括索引。  
2.载入到数据到表中以构建.MYD文件。  
3.按照需要的结构创建另外一张空表，但是这次要包含索引。这会创建需要的.frm和.MYI文件。  
4.获取读锁并刷新表。  
5.重命名第二张表的.frm和.MYI文件，让mysql认为是第一张表的文件。
6.释放读锁。  
7.使用alter table 来重建表的索引。该操作会通过排序来构建所有的索引，包括唯一索引。


