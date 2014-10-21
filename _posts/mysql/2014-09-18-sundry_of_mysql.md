---
layout: post  
title: "mysql 数据库资料整理"
description: ""
category: 知识总结--mysql
tags: [mysql] 
---
{% include JB/setup %}
# mysql 数据库资料整理
---

**1.数据库授权**  

     grant detail-permission  on one-database.*|one-table to someuser@hostinfo_here identified by 'set_pssword_here' ;

**2.查看用户的权限**  

    show grants for 'username'@'hostinfo';

**3.导出数据库**  

    mysqldump -u username -p password databasename  > exportfilename

**4.导入数据库文件**  

    source database.sql

**5.mysql查看数据库版本**  
1.登录时查看  

    mysql -u root -p
   
2.使用系统函数查看mysql数据库版本。  

    mysql>select version();
    mysql>select @@version;

3.使用status命令查看

    mysql> status

4.使用mysql -V命令查看  

    mysql -V
    mysql --version

5.zai mysql --help命令内容中查找  
    
    mysql --help | grep Distrib

6.show variables命令查看  

    show variables like "%version%";

**7.mysql中查看一个字段是否为空**  

    select * from table_name where field_name is null   正确
	
	select * from table_name where field_name = null    错误

**8.mysql show 的用法**  

	SHOW DATABASES:列出mysql server上的数据库。
	SHOW TABLES [FROM db_name]:列出数据库中的表。
	SHOW TABLE STATUS [FROM db_name]:列出表的列信息，比较详细。
	SHOW COLUMNS FROM tbl_name [FROM db_name]:列出表的列信息，同SHOW FIELDS FROM tbl_name [FROM db_name],DESCRIBE tbl_name [col_name]。  
	SHOW FULL COLUMNS FROM tbl_name [FROM db_name]:列出表的列信息，比较详细，同SHOW FULL FIELEDS FROM tbl_name [FROM db_name]。  
	SHOW INDEX FROM tbl_name [FROM db_name]:列出表的索引信息。  
	SHOW STATUS:列出server的状态信息。  
	SHOW VARIABLES:列出mysql系统参数值。  
	SHOW PROCESSLIST:查看当前mysql查询进程。  
	SHOW GRANTS FOR user:列出用户的授权命令。
	SHOW Create table table_name:列举出创建table_name表的语句
	Show engies:心事安装以后可用的存储引擎和默认的存储引擎  
	Show warnings:显示最后一个执行的语句所产生的错误、警告和通知  
	Show error:只显示最后一个执行语句所产生的错误  
	
**9.查看表字段的编码**  

	select charset(field) from table_name
	
**10.datetime类型的字段经过date_format转化后不能和time类型的字段比较**  

	datetime类型在数据库种存放的是binary，time在数据库种也存放的是binary类型，当date_format了datetime类型的字段时，返回的是一个字符串，字符串再和binary类型额值比较时，就会出错。
	解决方案：
	date_format(start_Date,"%T") < convert(time using utf8);
	

**11.CONV(N,from_base,to_base)数字的进制转换**  

在不同的数字基数之间转换数字。将数字N从from_base转换到to_base,并以字符串形式返回。如果任何一个参数为NULL，那么返回值也为NULL。参数N被解释为一个整数，但是也可以被指定为一个整数或一个字符串。最小基为2，最大基为36.如果to_base是一个负值，N将被看作为是一个有符号的数字。否则，N被视为是无符号的。CONV以64位精度工作。
	
	select conv(100,10,2);
	
**12.IFNULL(expr1,expr2)**  

如果expr1不是NULL，IFNULL()返回expr1,否则它返回expr2.IFNULL()返回一个数字或字符串值，取决于它使用的上下文环境。

	select IFNULL(1,0);      => 1
	select IFNULL(0,10);     => 0
	select IFNULL(1/0,10);   => 10
	select IFNULL(1/0,'yes');=> yes
	
**13.IF(expr1,expr2,expr3)**  

如果expr1是true(expr1 <> 0 且 expr1 <> NULL),那么IF() 返回expr2，否则返回expr3.IF()返回一个数字或字符串值，取决于它被使用的上下文。

	select IF(1>2,2,3);        => 3
	select IF(1<2,'yes','no'); => yes
	select IF(strcmp('test','test1'),'yes','no'); => no
	
	
**14.case ... when ... then ... else ... end 的用法**  

	CASE value WHEN [compare-value] THEN result [WHEN [compare-value] THEN result...] [ELSE result] END
	CASE WHEN [condition] THEN result [WHEN [condition] THEN result ...] [ELSE result] END
	
第一个版本返回result，其中value= compare-value。  
第二个版本中如果第一个条件为真，返回result。如果没有匹配的result值，那么结果在else后的result被返回。如果没有ELSE部分，那么NULL被返回。

	select CASE 1 WHEN 1 THEN "one" WHEN 2 THEN 'two' ELSE "more" END;
	=> "one"
	
	select CASE WHEN 1>0 THEN "true" ELSE "false" END；
	=> "true"
	
	select CASE BINARY "B" WHEN "a" then 1 when "b" then 2 END;
	=> NULL
	
**15.COALESCE的用法**  

coalesce()：返回参数中得第一个非空表达式（从左向右）  
使用示例：a,b,c三个变量。

	select coalesce(a,b,c);
	
如果a is null,则选择b；如果b is null,则选择c；如果a is not null，则选择a；如果a,b,c都为null，则返回null。

**16.有两种情况UPDATE不会影响表中得数据**  

1.当where中的条件在表中没有记录和它匹配时。
2.当将同样地值赋给某个字段时，如将字段abc赋值为‘123’，而abc的原值就是‘123’

注意：
	如果一个字段的类型是timestamp，那么这个字段在其他字段更新时自动更新。


**17.Insert 用法**  
1.有两种形式：
	
	insert into tablename(列名...) values(列值);
	
	insert intao tablename set column_name1=value1,column_name2=value2;
	
如果使用set方式，必须至少为一列赋值。如果某一个字段使用了省略值（如默认值或自增值），这两种方法都可以省略这些字段。  
Mysql在values上也做了变化。如果values中什么也不写，那MySql将用表中每一列的默认值来插入新记录。
	
	insert into users() values();
	
如果表名后什么都不写，就表示向表中所有的字段赋值。使用这种方式，不仅values中的值要和列数一致，而且顺序不能颠倒。  

2.使用insert插入多条记录  

	INSERT INTO users(name, age) VALUES('姚明', 25), ('比尔.盖茨', 50), ('火星人', 600);

这不是标准的SQL语法，只能在mysql中使用。

**18.replace语句**  
使用Replace插入一条记录时，如果不重复，replace就和insert的功能一样，如果有重复记录，replace就使用新记录的值来替换原来的记录值。  
使用replace的最大好处就是可以将delete和insert合二为一，形成一个原子操作。  
在使用replace时，表中必须有唯一索引，而且这个索引所在的字段不能允许为空，否则Replace就和insert完全一样的。   
在执行REPLACE后，系统返回了所影响的行数，如果返回1，说明在表中并没有重复的记录，如果返回2，说明有一条重复记录，系统自动先调用了 DELETE删除这条记录，然后再记录用INSERT来插入这条记录。如果返回的值大于2，那说明有多个唯一索引，有多条记录被删除和插入。

**19.delete和truncat table**  
delete语句可以使用where对要删除的记录进行选择。而使用truncate table将删除表中的所有记录。  
如果要清空表中的所有记录，可以使用下面的两种方法：
	
	delete from table1;
	
	truncate table table1;

delete 不加where字句，那么它和truncate table是一样的，delete可以返回被删除的记录数，而truncate table返回的是0；  
如果一个表中有自增字段，使用TRUNCATE TABLE和没有WHERE子句的DELETE删除所有记录后，这个自增字段将起始值恢复成1.如果你不想这样做的话，可以在DELETE语句中加上永真的WHERE，如WHERE 1或WHERE true。  

**20.索引的优点**  

* 索引大大减少了服务器需要扫描的数据量
* 索引可以帮助服务器避免排序和临时表
* 索引可以将随机I/O变为顺序I/O

**21.查询时手动加锁语句**  

	select ... for update.
	
**22.表的前缀是有限制的**  

	Error : Specified key was too long; max key length is 1000 bytes
	MyISAM的索引前缀的最大长度限定为1000;
	
	Error : Specified key was too long; max key length is 767 bytes
	InnoDB的索引前缀的最大长度限定为767；
	

	






