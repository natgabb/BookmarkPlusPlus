var bg = {
	getChanged: function(){
		return JSON.parse(localStorage.getItem('changed') || "[]");
	},
	
	
	addChanged: function(bookmark){
	
		var itemsStr = localStorage.getItem('changed') || "[]";
		var items = JSON.parse(itemsStr);
		
		items.push(bookmark);
		localStorage.setItem('changed',JSON.stringify(items));
	},
	
	
	getDeleted: function(){
		return JSON.parse(localStorage.getItem('deleted') || "[]");
	},
	
	
	addDeleted: function(bookmark){
	
		var itemsStr = localStorage.getItem('deleted') || "[]";
		var items = JSON.parse(itemsStr);
		
		var notDuplicate = true;
		//iterate through array and if there's a duplicate stop
		for(var i=0; i < items.length; i++){
			if(items[i].title == bookmark.title && items[i].url == bookmark.url) notDuplicate = false;
		}
		
		if(notDuplicate){
			items.push(bookmark);
			localStorage.setItem('deleted',JSON.stringify(items));
		}
	},
	
	
	restoreDeleted: function(index){
	
		var items = JSON.parse(localStorage.getItem('deleted') || "[]");
		var bookmark = items.splice(index,1);
		
		//Re-creates the bookmark.
		chrome.bookmarks.create({'parentId': '1',
					 'title': bookmark[0].title,
					 'url': bookmark[0].url}
		 );
					 
		localStorage.setItem('deleted',JSON.stringify(items));
	},
	
	
	restoreChanged: function(index){
	
		var items = JSON.parse(localStorage.getItem('changed') || "[]");
		var bookmarkObj = items.splice(index,1)[0];
		
		//Re-creates the bookmark.
		chrome.bookmarks.update(String(bookmarkObj.oldObj.id), {
			title: bookmarkObj.oldObj.title,
			url: bookmarkObj.oldObj.url
		});
		localStorage.setItem('changed',JSON.stringify(items));
	},
	
	
	clearChanged: function(){
		localStorage.setItem('changed','[]');
	},
	
	
	clearDeleted: function(){
		localStorage.setItem('deleted','[]');
	}
}

