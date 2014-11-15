---
layout: page
title: Zero
tagline: The harder the more fortunate.
---
{% include JB/setup %}

{% for post in site.posts %}
<div class = "card">
    <div  class = "date_label">
    	<div class="day_month">
            {{ post.date | date:"%m/%d" }}
        </div>
        <div class="year">
            {{ post.date | date:"%Y" }}
        </div>
    </div>
    <div class="my_content">
		{{ post.content  | | split:'<!--break-->' | first }}
    </div>
	<div class = "read_more">
		<a class="fa fa-link" href="{{ BASE_PATH }}{{ post.url }}">  查看全文&hellip;</a>
	</div>
	
</div>

{% endfor %}