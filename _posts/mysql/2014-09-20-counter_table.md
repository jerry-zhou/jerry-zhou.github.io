---
layout: post  
title: "mysql 计数器表"
description: ""
category: 读书笔记--高性能mysql
tags: [counter,高性能mysql]
---
{% include JB/setup %}
# 计数器表
---


**1.应用场景**  

 一个用户的朋友数、文件的下载次数、网站的访问量  
 
**2.创建一张独立的表存储计算器通常是一个好主意，通常可使计算器表小且快**  

**3.假设有一个计数器表，只有一行数据，记录网站的点击次数**  

	create table hit_couter(
		cnt int unsigned not null
	) ENGINE = InnoDB;
	
网站的每一次点击都会导致对计数器进行更新：  
 
 	update hit_counter set cnt = cnt +1;
 	
这时问题就出现了，对于任何想要更新这一行的事务来说，这条记录上都是一个全局的互斥锁。这会使得这些事务只能串行执行。要获得更高的并发更新性能，也可以将计数器保存在多行中，每次随机选择一行进行更新。

	create table hit_counter (
		slot tinyint unsigned not null primary key,
		cnt int unsigned not null
	) ENGINE = InnoDB;
	
然后预先在这张表增加100行数据。现在选择一个随机的槽（slot）进行更新：

	update hit_counter set cnt = cnt + 1 where slot = RAND() * 100;
	
	
要获得统计的结果，需要使用下面这样的聚合查询：

	select SUM(cnt) from hit_counter;
	
一个常见的需求是每隔一段时间开始一个新的计数器。需要简单地修改一下表

	create table daily_hit_counter (
		day date not null,
		slot tinyint unsigned not null,
		cnt int unsigned not null,
		primary key(day,slot)
	) ENGINE=InnoDB;

在这个场景种，可以不用像前面的例子那样预先生成行，而用ON DUPLICATE KEY UPDATE代替：  

	insert into daily_hit_counter (day,slot,cnt)
	values(CURRENT_DATE,RAND()*100,1)
	ON DUPLICATE KEY UPDATE cnt = cnt +1;
	
	
如果希望减少表的行数，以避免太大，可以写一个周期执行的任务，合并所有的结果到0号槽，并且删除其他所有的槽。  

	update daily_hit_counter as c
	inner join (
		select day,SUN(cnt) as cnt,MIN(slot) as mslot
		from daily_hit_counter
		group by day
	) as X USING(day)
	set c.cnt = IF(c.slot=x.mslot,x.cnt,0),
	    c.slot = IF(c.slot=x.mslot,0,c.slot);
	    
	    
	delete from daily_hit_counter where slot <> 0  and cnt = 0;
	
