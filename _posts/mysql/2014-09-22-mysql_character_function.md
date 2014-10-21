---
layout: post  
title: "mysql处理字符函数小结"
description: ""
category: 知识总结--mysql
tags: [mysql]
---
{% include JB/setup %}
# mysql处理字符函数小结
---


**1.计算字符串字符数和字符串长度 - CHAR\_LENGTH(s)**  

 CHAR_LENGTH(str):返回str所包含的字符个数。  
 	
	select CHAR_LENGTH('mystr');
	
**2.合并字符 - CONCAT(s1,s2,....) 与 CONCAT_WS(x,s1,s2,...)**  

CONCAT(s1,s2,...):返回结果为连接参数产生的字符串，或许有一个或多个参数。如果有任何一个参数为NULL，则返回值为NULL。

	select CONCAT('MySQL','','5.5',NULL,'Function');
	
CONCAT_WS(x,s1,s2,...):代表CONCAT WITH SEPARATOR，是CONTCAT
的特殊形式。第一个参数x是其它参数的分隔符，分隔符的位置在要连接的字符串之间。分隔符可以是字符串，也可以是其它参数。如果分隔符是NULL，则结果为NULL。

	select CONCAT_WS('.','David','Tian'),CONCAT_WS(NULL,'MySQL','5.5');

**3.替换字符串函数 - INSERT(s1,x,len,s2)**  

 INSERT(s1,x,len,s2):返回字符串s1，其子字符串起始于x位置和被字符串s2取代的len字符。如果x超过字符串长度，则返回值为原始字符串。假如len的长度大于其它字符串长度，则从位置x开始替换。若任何一个参数为NULL，则返回值为NULL。

	select INSERT('Softtakian',2,4,'!@#$') as c1,
	INSERT('Softtakian',-1,4,'@@@@') AS c2,
	INSERT('Softtakian',3,100,'$$') AS c3,
	INSERT('Softtakian',2,4,'%@') AS c4;
	
**4.字母大小写转换函数 - LOWER(s),LCASE(s),UPPER(s),UCASE(s)**  

LOWER(str)和LCASE(str)：将字符串str中得字母全部转换成小写字母。  

	select LOWER('MySQL and Oracle ASM') as c1,
	LCASE('Database Administrator') as c2;
	
UPPER(str) 和 UCASE(str)：可以将字符串str中的字母全部转换成大写字母。

	select UPPER('sunshine.ma') c1,UCASE('Sunshine.Ma') c2;
	
**5.获取指定长度字符串： LEFT(s,n),RIGHT(s,n)**  

LEFT(s,n):返回字符串s开始最左边n个字符。

	select LEFT('ths is a testing email',7) as c1;
	
RIGHT(s,n):返回字符串str最右边n个字符。

	select RIGHT('this is a testing email',7) as c1;
	
**6.填充字符串函数：LPAD(s1,len,s2),RPAD(s1,len,s2)**  

LPAD(s1,len,s2):返回字符串s1，其左边由字符串s2填补到len字符长度。假如s1的长度大于len，则返回值缩短至len字符。

	select LPAD('Hello',4,'%%') as c1,LPAD('Hello',10,'*') as c2;
	
RPAD(s1,len,s2)：返回字符串s1，其右边被字符串s2填补至len字符串s1的长度大于len，则返回值被缩短到len字符长度。

	select PRAD('Hello',4,'%') as c1,PRAD('Hello',10,'*') as c2;
	
**7,删除空格字符串函数：LTRIM(s),RTRIM(s),TRIM(s)**  

LTRIM(s):返回字符串s，字符串左侧空格字符被删除。
RTRIM(s):返回字符串s，字符串右侧空格字符被删除。
TRIM(s):返回字符串s，字符串两侧空格字符被删除。


**8.删除指定字符串的函数 TRIM(s1 from s)**  

TRIM(s1 from s):删除字符串s两端子字符串s1，s1为可选项，在未指定情况下，删除空格。

**9.重复生成字符串的函数:REPEAT(s,n)**  

REPEAT(s,n) :  返回一个由重复的字符串 s 组成的字符串，字符串 s 的数目等于 n 。若 n<=0, 则返回一个空字符串。若 s 或 n 为 NULL, 则返回 NULL 。

	select REPEAT('abc',3) as c1, REPEAT('abc',-1) as c2, REPEAT('abc',NULL) as c3;
	

**10.空格函数：SPACE(n)**  

SPACE(n)：返回一个由n个空格组成的字符串。

**11.替换函数： REPLACE(s,s1,s2)**  

REPLACE(s,s1,s2) : 使用字符串 s2 替代字符串 s 中所有的字符串 s1 。

	select REPLACE('xxx.mysql.com','x','w') as c1;
	
**12.比较字符串大小函数：STRCMP(s1,s2)**   

STRCMP(s1,s2) : 若所有的字符串均相同，则返回 0 ；若根据当前分类次序，第一个参数小于第二个，则返回 -1, 其它情况返回 1 。

	select STRCMP('txt','txta') as c1, STRCMP('txta','txt') as c2, STRCMP('txt','txt') as c3;
  
**13. 字符串截取函数: SUBSTRING(s,n,len),MID(s,n,len)**   
 
 SUBSTRING(s,n,len) : 从字符串 s 返回一个长度为 len 的子字符串，起始位置为 n 。若 n 为负数，则子字符串的位置起始于字符串结尾的 n 个字符，即倒数第 n 个字符。若 len 省略，则取至结尾。  
 MID(s,n,len) :  与 SUBSTRING(s,n,len) 作用相同。
 
**14. 匹配子串开始位置函数： LOCATE(s1,s2) ,  POSITION(s1 IN s2) , INSTR(s2,s1)**  

LOCATE(s1,s2) :  返回子字符串 s1 在字符串 s2 中的开始位置。  
POSITION(s1 IN s2) : 返回子字符串 s1 在字符串 s2 中的开始位置。  
INSTR(s2,s1) :返回子字符串 s1 在字符串 s2 中的开始位置。
 
**15. 字符串逆序函数： REVERSE(s)**  

REVERSE(s) :  将字符串 s 反转，返回的字符串的顺序和 s 字符串顺序相反。 

**16. 返回指定位置的字符串函数： ELT(n,s1,s2,s3,...,Sn)**  

ELT(n,s1,s2,s3,...,Sn) :  若 n=1 ，则返回字符串 S1 ，若 n=2, 则返回字符串 S2, 依此类推。若 n 小于 1 或大于参数的数目，则返回值为 NULL 。 

	mysql> select ELT(3,'1st','2nd','3rd') as c1, ELT(3,'oracle','MySQL') as c2;

**17. 返回指定字符串位置的函数：FIELD(s,s1,s2,...)**   

FIELD(s,s1,s2,...) : 返回字符串 s 在列表 s1,s2,... 中第一次出现的位置，在找不到 s 的情况下，返回值为 0 。如果 s 为 NULL ，则返回值为 0 ，原因是 NULL 不能同任何值进行同等比较。

	select FIELD('Hi','hihi','Hey','Hi','bas','ciao') as c1, FIELD('Hi','Hey','Lo','Hilo','foo') as c2; 

**18. 返回子串位置的函数： FIND_IN_SET(s1,s2)**  

FIND_IN_SET(s1,s2) :  返回字符串 s1 在字符串 s2 中出现的位置，字符串列表是一个由多个逗号 “,” 分开的字符串组成的列表。如果 s1不在s2中或s2为空字符串，则返回 0 。如果任何一个参数为 NULL，则返回值为NULL。 S1 中不能包含一个逗号 “,” 。

	select FIND_IN_SET('Hi','hihi,Hey,Hi,bas') as c1;

**19. 选取字符串的函数： MAKE_SET(x,s1,s2,...)**  

MAKE_SET(x,s1,s2,...) :  返回由 x 的二进制数指定的相应位的字符串组成的字符串， s1 对应比特 1,s2 对应比特 01, 依此类推。 s1,s2... 中的 NULL 值不会被添加到结果中。

	select MAKE_SET(1,'a','b','c') as c1, MAKE_SET(1|4,'hello','nice','world') as c2, MAKE_SET(1|4,'hello','nice',NULL,'world') as c3, MAKE_SET(0,'a','b','c') as c4;

+----+-------------+-------+----+

| c1 | c2          | c3    | c4 |

+----+-------------+-------+----+

| a  | hello,world | hello |    |

+----+-------------+-------+----+

说明：

1 的二进制值为 0001, 4 的二进制值为 0100 ， 1 和 4 进行或操作之后的二进制值为 0101 ，从右到左第 1 位和第 3 位为１。

MAKE_SET(1,’a’,’b’,’c’): 返回第 1 个字符串；

MAKE_SET(1|4,'hello','nice','world')：返回从左端开始第 1 和第 3 个字符组成的字符串；

MAKE_SET(1|4,'hello','nice',NULL,'world')： NULL 值不会添加到结果中，因此只会返回第一个字符串；

MAKE_SET(0,'a','b','c'): 返回空字符串。



