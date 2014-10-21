---
layout: post  
title: "mysqldump小结"
description: ""
category: 知识总结--mysql
tags: [mysqldump] 
---
{% include JB/setup %}
# mysqldump小结
---

### 1.mysqldump 的几种常用方法  

(1) 导出整个数据库(包括数据库中的数据)  

	mysqldump -u username -p dbname > dbname.sql
	
(2) 导出数据库结构(不含数据)  

	mysqldump -u username -p -d dbname > dbname.sql
	
(3) 导出数据库中的某张数据表(包含数据)  

	mysqldump -u username -p dbname tablename > tablename.sql
	
(4) 导出数据库中得某张数据表的表结构  

	mysqldump -u usernmae -p -d dbname tablename > tablename.sql
	
(5) 如果导出来的文件过大，请将其压缩(具体用法请参考“gzip的用法”)，方便传输与归档  

	gzip -c filename > filename.gz (压缩)  
	guzip -c filename.gz > filename (解压缩)  
	
### 2.mysqldump 常用参数说明  

* –all-databases , -A  
  导出全部数据库  

		mysqldump -uroot -p –all-databases

* –all-tablespaces , -Y  
  导出全部表空间。  
		
		mysqldump -uroot -p –all-databases –all-tablespaces 

* –no-tablespaces , -y  
  不导出任何表空间信息。  

		mysqldump -uroot -p –all-databases –no-tablespaces

* –add-drop-database  
  每个数据库创建之前添加drop数据库语句。  

		mysqldump -uroot -p –all-databases –add-drop-database

* –add-drop-table  
  每个数据表创建之前添加drop数据表语句。(默认为打开状态，使用–skip-add-drop-table取消选项)

		mysqldump -uroot -p –all-databases (默认添加drop语句)
		mysqldump -uroot -p –all-databases –skip-add-drop-table (取消drop语句)

* –add-locks  
  在每个表导出之前增加LOCK TABLES并且之后UNLOCK TABLE。(默认为打开状态，使用–skip-add-locks取消选项)

		mysqldump -uroot -p –all-databases (默认添加LOCK语句)
		mysqldump -uroot -p –all-databases –skip-add-locks (取消LOCK语句)

* –comments  
  附加注释信息。默认为打开，可以用–skip-comments取消

		mysqldump -uroot -p –all-databases (默认记录注释)
		mysqldump -uroot -p –all-databases –skip-comments (取消注释)

* –compact  

	导出更少的输出信息(用于调试)。去掉注释和头尾等结构。可以使用选项：–skip-add-drop-table –skip-add-locks –skip-comments –skip-disable-keys
	
		mysqldump -uroot -p –all-databases –compact

* –complete-insert, -c  

  使用完整的insert语句(包含列名称)。这么做能提高插入效率，但是可能会受到max_allowed_packet参数的影响而导致插入失败。

		mysqldump -uroot -p –all-databases –complete-insert

* –compress, -C  
  在客户端和服务器之间启用压缩传递所有信息

		mysqldump -uroot -p –all-databases –compress

* –databases, -B  
  导出几个数据库。参数后面所有名字参量都被看作数据库名。

		mysqldump -uroot -p –databases test mysql

* –debug  
  输出debug信息，用于调试。默认值为：d:t:o,/tmp/mysqldump.trace

		mysqldump -uroot -p –all-databases –debug
		mysqldump -uroot -p –all-databases –debug=” d:t:o,/tmp/debug.trace”

* –debug-info  
  输出调试信息并退出

		mysqldump -uroot -p –all-databases –debug-info

* –default-character-set
  设置默认字符集，默认值为utf8
  
		mysqldump -uroot -p –all-databases –default-character-set=latin1

* –delayed-insert  
  采用延时插入方式（INSERT DELAYED）导出数据

		mysqldump -uroot -p –all-databases –delayed-insert

* –events, -E  
  导出事件。
	
		mysqldump -uroot -p –all-databases –events

* –flush-logs  
  开始导出之前刷新日志。    
  请注意：假如一次导出多个数据库(使用选项–databases或者–all-databases)，将会逐个数据库刷新日志。除使用–lock-all-tables或者–master-data外。在这种情况下，日志将会被刷新一次，相应的所以表同时被锁定。因此，如果打算同时导出和刷新日志应该使用–lock-all-tables 或者–master-data 和–flush-logs。  

		mysqldump -uroot -p –all-databases –flush-logs

* –flush-privileges  
  在导出mysql数据库之后，发出一条FLUSH PRIVILEGES 语句。为了正确恢复，该选项应该用于导出mysql数据库和依赖mysql数据库数据的任何时候。

		mysqldump -uroot -p –all-databases –flush-privileges

* –force  
  在导出过程中忽略出现的SQL错误。 

		mysqldump -uroot -p –all-databases –force

* –host, -h  
  需要导出的主机信息  

		mysqldump -uroot -p –host=localhost –all-databases

* –ignore-table  
  不导出指定表。指定忽略多个表时，需要重复多次，每次一个表。每个表必须同时指定数据库和表名。例如：–ignore-table=database.table1 –ignore-table=database.table2 ……

		mysqldump -uroot -p –host=localhost –all-databases –ignore-table=mysql.user

* –lock-all-tables, -x  
  提交请求锁定所有数据库中的所有表，以保证数据的一致性。这是一个全局读锁，并且自动关闭–single-transaction 和–lock-tables 选项。

		mysqldump -uroot -p –host=localhost –all-databases –lock-all-tables

* –lock-tables, -l  
  开始导出前，锁定所有表。用READ LOCAL锁定表以允许MyISAM表并行插入。对于支持事务的表例如InnoDB和BDB，–single-transaction是一个更好的选择，因为它根本不需要锁定表。  
  请注意当导出多个数据库时，–lock-tables分别为每个数据库锁定表。因此，该选项不能保证导出文件中的表在数据库之间的逻辑一致性。不同数据库表的导出状态可以完全不同。

		mysqldump -uroot -p –host=localhost –all-databases –lock-tables

* –no-create-db, -n  
  只导出数据，而不添加CREATE DATABASE 语句。

		mysqldump -uroot -p –host=localhost –all-databases –no-create-db

* –no-create-info, -t  
  只导出数据，而不添加CREATE TABLE 语句。 

		mysqldump -uroot -p –host=localhost –all-databases –no-create-info

* –no-data, -d  
  不导出任何数据，只导出数据库表结构。

		mysqldump -uroot -p –host=localhost –all-databases –no-data

* –password, -p
  连接数据库密码

* –port, -P
  连接数据库端口号

* –user, -u
  指定连接的用户名。
  
### 3.mysqldump常用实例  

* 1.数据库备份与还原  
    假设有数据库demo_db,执行以下命令，即可完成对整个数据库的备份：
  
		mysqldump -u root -p demo_db > demo_db.sql  
		
    如果对数据进行还原，可以执行如下命令：  
 
		mysqldump -u username -p demo_db < demo_db.sql
		
    还可以使用如下命令还原数据：
    
		mysql> source demo_db.sql
		
* 2.多台服务器上表结构的比对。  
  分别导出多台服务器上每个库的表结构，然后选择一个基准库，根据这个基准库用diff比较各个库中表结构的不同。然后可以分析出哪张表多或少字段，字段的类型是否相同。
  