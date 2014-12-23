---
layout: post  
title: "php获取变量小结"
description: ""
category: 知识总结--php
tags: [php variable] 
---
{% include JB/setup %}
# php获取变量小结
---

### 1.php变量解析的顺序

php中的$_REQUEST是可以在php.ini中通过request_order来配置。在php5.3以上的版本默认设置的是“GP”（GET and POST），当然你可以在request_order中设置C（Cookies）。

php.ini文件中配置的相应说明：

	; This directive determines which super global data (G,P,C,E & S) should
	; be registered into the super global array REQUEST. If so, it also determines
	; the order in which that data is registered. The values for this directive are
	; specified in the same manner as the variables_order directive, EXCEPT one.
	; Leaving this value empty will cause PHP to use the value set in the
	; variables_order directive. It does not mean it will leave the super globals
	; array REQUEST empty.
	; Default Value: None
	; Development Value: "GP"
	; Production Value: "GP"
	; http://php.net/request-order
	request_order = "GP"

php手册上的说明：

	This directive describes the order in which PHP registers GET, POST and Cookie variables into the _REQUEST array. Registration is done from left to right, newer values override older values.
	
当然，如果在GET和POST中重复的变量名，就会发生覆盖（后面的覆盖前面的）。

示例:

***index.php***
	
	<?php
		print_r($_REQUEST);
	?>
	
***test.html***

	<form action="index.php?myname=jerryzhou" method="post">
    	<input name="age" value="20"/>
    	<input name="username" value="zhouliang" />
    	<input type="submit" value="submit" />
	</form>

输出结果如下：

	Array ( [myname] => jerryzhou [age] => 20 [username] => zhouliang )
	
如果post中的变量名覆盖了get中的变量名：

***test.html***

	<form action="index.php?myname=jerryzhou" method="post">
    	<input name="age" value="20"/>
    	<input name="myname" value="zhouliang" />
    	<input type="submit" value="submit" />
	</form>
	
输出的结果如下（很明显POST中的myname已经覆盖了GET中的myname）：

	Array ( [myname] => zhouliang [age] => 20 )
	

现在将request_order设置如下（记住重启php-fpm）：

	request_order = "GPC"
	
输出的结果如下：

	Array ( [myname] => zhouliang [age] => 20 [PHPSESSID] => hipbaq0rbqgi8s3a35vli3ush0 )
	
出于安全原因：php5.3后默认设置为了“GP“。


### 2. 任何输入的值请做验证

**2.1 现在项目中有输入的变量是没有做任何验证过滤直接交给mysql来做查询的，这样做，是很危险的，示例：**

tablename id 为int型
	
	$sql = "select * from tablename where id = {$_REQUEST['id']}";
	
如果$_REUQEST['id'] 是一个数字时，当然，这样是不会有问题的。当时你放心将这个代码交付吗？给你来点焦心的。

假设$_REQUEST['id'] 不存在，那么你执行的sql语句就会成这样的：
	
	$sql = "select * from tablename where id = ";
	
获取$_REQUEST['id']是一个字符串（aaa），那么你执行的sql语句就会变成这样的:

	$sql = "select * from tablename where id = aaa";
	($sql = "select * from wedaily_user where id = aaa")(做个小测试)
	
到数据库里执行完就变成了这样的了：

	ERROR 1054 (42S22): Unknown column 'aaa' in 'where clause'
	
为什么不能将输入的数据都做一次过滤，然后再用来做业务处理呢？
如上例我们可以这么做：

	$id = intval($_GET['id']); //用$_GET['id'],$_POST['id'] 代替$_REQUEST['id']
	if ($id <= 0) {
		//报错，阻止往下执行
	}
	$sql = "select * from tablename where id = {$id}";

当然，对于其他类型的数据我们是都需要做过滤的，比如字符串的长度，字符串可以输入的字符，邮箱，电话号码等等，请自行总结。

**2.2 变量在最开始的时候过滤验证就可以，不要在用到的时候再处理，示例如下：**

	if (array_key_exists("op", $_REQUEST) && strtolower(trim($_REQUEST["op"])) = "generate") {
		...
	} else if (array_key_exists("op", $_REQUEST) && strtolower(trim($_REQUEST["op"])) = "delete") {
		...
	} else if (array_key_exists("op", $_REQUEST) && strtolower(trim($_REQUEST["op"])) = "save") {
		...
	} else {
		...
	}
	
好吧，为什么要这么写呢，为什么不能精简一点呢？

	$op = array_key_exists("op",$_REQUEST) ? strtolower(trim($_REQUEST['op'])) : '';
	switch ($op) {
		case "generate":
			....
			break;
		case "delete":
			...
			break;
		case "save":
			...
			break;
		default:
			...
			break
	}

(目前只想到这么多，就写到这，下次再更新)
	
		
	



	

	
