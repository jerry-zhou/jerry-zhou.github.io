---
layout: post  
title: "mysql处理数字的函数小结"
description: ""
category: 知识总结--mysql
tags: [mysql]
---
{% include JB/setup %}
# mysql处理数字的函数小结
---


**1.ABS(x):返回x的绝对值**  

	select ABS(1),ABS(-1),ABS(0);

![function_abs](./images/mysql_digital_function/function_abs.png)

**2.PI():返回圆周率**  

	select PI();
	

**3.SQRT(x):返回x的平方根，要求（x为非负数，返回NULL）**

	select SQRT(49),SQRT(0),SQRT(-49);  


**4.MOD(x,y):求余函数，返回x被y除后的余数；对于带有小数部分的数据值也起作用，它返回除法运算后的精确余数**  

	select MOD(31,8), MOD(21,-8), MOD(-7,2), MOD(-7,-2), MOD(45.5,6);


**5.CEIL(X):返回不小于X的最小整数值，返回值转为一个BIGINT.**
 
	select CEIL(-3.35), CEIL(3.35);

**6.CEILING(X):同CEIL(X)**  

	select CEILING(-3.35), CEILING(3.35);

**7.FLOOR(X):返回不大于X的最大整数值，返回值转为一个BIGINT.**  

	select FLOOR(-3.35), FLOOR(3.35);

**8.RAND()和RAND(X)**  
RAND(X)返回一个随机浮点数，范围在 0~1之间，X为整数，它被作为种子值，用来产生重复序列。即当X相同时，产生的随机数也相同。

	select RAND(10),RAND(10),RAND(2),RAND(-2);

RAND():不带参数的RAND()每次产生不同0~1之间的随机数。

	select RAND(),RAND(),RAND();
	
**9.ROUND(X)和ROUND(X,Y):四舍五入函数，对X值按照Y进行四舍五入，Y可以省略，默认值为0；若Y不为0，则保留小数点后面指定Y位。**  

	select ROUND(-1.14),ROUND(-1.9),ROUND(1.14),ROUND(1.9);
	
	select ROUND(1.38,1),ROUND(1.38,0),ROUND(232.38,-1),ROUND(232.38,-2);
	
**10.TRUNCATE(X,Y):与ROUND(X,Y)功能类似，但不进行四舍五入，只进行截取。**

	select TRUNCATE(1.33,1), TRUNCATE(1.99,1), TRUNCATE(1.99,0), TRUNCATE(19.99,-1);
	
**11.SIGN(X):返回参数X的符号，X的值为负、零或正数时返回的结果依次为-1,0或者1**

	select SIGN(-21),SIGN(-0),SIGN(0),SIGN(0.0),SIGN(21);
	
**12.POW(X,Y),POWER(X,Y)和EXP(X)**  
POW(X,Y)与POWER(X,Y)功能相同，用于返回X的Y次乘方的结果值

	select pow(2,2),pow(2,-2),powe(-2,2),pow(-2,-2);
	
	select power(2,2),power(2,-2),power(-2,2),power(-2,-2);
	
EXP(X):返回e的X乘方后的值：

	select EXP(3),EXP(0),EXP(-3);
	
**13.LOG(X)和LOG10(X):对数运算符函数（X必须为正数），LOG(X)--返回X的自然对数（X相对于基数e的对数）LOG10(X)--返回x的基数为10的对数：**  

	select LOG(-3),LOG(0),LOG10(-100),LOG10(0),LOG10(100);
	
	
**14.RADIANS(X)和DEGREES(X):角度与弧度转换函数**  

	 select RADIANS(90),RADIANS(180),DEGREES(PI()),DEGREES(PI()/2);
	 
**15.SIN(X),ASIN(X),COS(X),ACOS(X),TAN(X),ATAN(X),COT(X)**  

SIN(X): 正弦函数，其中Ｘ为弧度值  
ASIN(X): 反正弦函数　其中Ｘ必须在－１到１之间  
COS(X): 余弦函数，其中Ｘ为弧度值  
ACOS(X): 反余弦函数　其中Ｘ必须在－１到１之间  
TAN(X): 正切函数，其中Ｘ为弧度值  
ATAN(X): 反正切函数，ATAN(X)与TAN(X)互为反函数  
COT(X):　余切函数，函数COT和TAN互为倒函数  
	
	select SIGN(PI()/2),ASIN(1),COS(PI()), ACOS(-1), TAN(PI()/4), ATAN(1), COT(0.5);