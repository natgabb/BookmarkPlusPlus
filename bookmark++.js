//@author Gabriel Gheorghian
//@author Natacha Gabbamonte

var MyApp = angular.module('MyApp', ['ui.bootstrap']);
var bg = chrome.extension.getBackgroundPage().bg;

/* ###############################################################################
 * ##																			##
 * ##							Factory											##
 * ##																			##
 * ############################################################################### */
MyApp.service('bookmarkFactory', function() {
    var myBookmarks = [];
    var myChanged = [];
    var myDeleted = [];
    
	return{
		addBookmark: function(value){
			if(value != "" && value != null){
				myBookmarks.push(value);
			}
		},
		sortArray: function(){
			myBookmarks = myBookmarks.sort(function(a, b){
				var dateA=new Date(a.date), dateB=new Date(b.date)
				return dateB-dateA //sort by date ascending
			});
		},
		getBookmarks: function(){
			return myBookmarks;
		},
		getChanged: function(){
			return myChanged;
		},
		getDeleted: function(){
			return myDeleted;
		},
		loadChanged: function(){
			var array = bg.getChanged();
			myChanged = array;
			return myChanged;
		},
		loadDeleted: function(){
			var array = bg.getDeleted();
			myDeleted = array;
			return myDeleted;
		},
		updateBookmark: function(){
		
		},
		deleteBookmark: function(index){
			myBookmarks.splice(index, 1);
		},
		clearBookmarks: function(){
			myBookmarks = [];
		},
		clearChanged: function(){
			bg.clearChanged();
			myChanged = [];
		},
		clearDeleted: function(){
			bg.clearDeleted();
			myDeleted = [];
		},
		restoreChanged: function(index){
			bg.restoreChanged(index);
			myChanged.splice(index,1);
		},
		restoreDeleted: function(index){
			bg.restoreDeleted(index);
			myDeleted.splice(index,1);
		}
	}
});


/* ###############################################################################
 * ##																			##
 * ##						 Controller											##
 * ##																			##
 * ############################################################################### */
MyApp.controller("BookmarkController", function($scope, bookmarkFactory, $dialog){
	
	$scope.Bookmarks = bookmarkFactory.getBookmarks();
	$scope.Changed = bookmarkFactory.loadChanged();
	$scope.Deleted = bookmarkFactory.loadDeleted();
	
	
	/*  
	###############################################
	## Method used to initialize controller		 ## 
	###############################################
	*/
	$scope.Init = function(){
		$scope.getChildren("0"); // Loads the bookmarks
		$("#search").focus();
		$scope.SelectedTab = 0;
	}
	
	
	/*  
	#######################################
	## Method used to change tabs		 ## 
	#######################################
	*/
	$scope.ChangeTab = function(value){
		
		switch(value){
			case 0:
				bookmarkFactory.clearBookmarks();
				$scope.getChildren("0");
				$scope.Bookmarks = bookmarkFactory.getBookmarks();
				break;
			case 1:
				$scope.Changed = bookmarkFactory.loadChanged();
				break;
			case 2:
				$scope.Deleted = bookmarkFactory.loadDeleted();
				break;
			default:
				break;
		}
		$scope.SelectedTab = value;
	}
	
	
	
	/*  
	###############################################
	## Method used to get the children bookmarks ## 
	###############################################
	*/
	$scope.getChildren = function(id){
		//get all the bookmarks from the root
		chrome.bookmarks.getChildren(id, function(children) {
			children.forEach(function(bookmark) {
				if(bookmark.url != undefined){
					bookmarkFactory.addBookmark({
						id:bookmark.id, //id
						title:bookmark.title, //title
						url:bookmark.url, //url
						date:bookmark.dateAdded, //date added
					});
					
					bookmarkFactory.sortArray();
					$scope.$apply();
				}
				$scope.getChildren(bookmark.id);
			});
		});
	}
	
	
	/*  
	###############################################
	## Method used to replace a bookmark			 ## 
	###############################################
	*/
	$scope.ReplaceBookmark = function(bookmark){
		
		//get current tab
		chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
			var tab = tabs[0];
			if(tab.title != bookmark.title || tab.url != bookmark.url){
				bg.addChanged(
					{
					'newObj':{'id':bookmark.id,'title':tab.title,'url':tab.url}, 
					'oldObj':{'id':bookmark.id,'title':bookmark.title,'url':bookmark.url}
					}
				);
				
				//updates current page with this page
				chrome.bookmarks.update(String(bookmark.id), {
					title: tab.title,
					url: tab.url
				});
				
				//update object too
				bookmark.title = tab.title;
				bookmark.url = tab.url;
				$scope.$apply();
			}
		});
	}
	
	
	/*  
	###########################################
	## 		Method used to open a bookmark	 ## 
	###########################################
	*/
	$scope.OpenBookmark = function(bookmark){
		// Opens the bookmark that was clicked on in a new tab.
		chrome.tabs.create({'url': bookmark.url}, function(tab) {
			// Tab opened.
		});
	}
	
	/*  
	###########################################
	## Method used to delete a bookmark		 ## 
	###########################################
	*/
	$scope.DeleteBookmark = function(bookmark, index){
	
		//delete object in factory
		bookmarkFactory.deleteBookmark(index);
		chrome.bookmarks.remove(bookmark.id, function(tab) {});
		bg.addDeleted(bookmark);
	}

	/*  
	###########################################
	## Method used to clear Changed Bookmarks## 
	###########################################
	*/
	$scope.ClearChanged = function(){
		bookmarkFactory.clearChanged();
		$scope.Changed = bookmarkFactory.loadChanged();
	}
	
	/*  
	###########################################
	## Method used to clear Deleted Bookmarks## 
	###########################################
	*/
	$scope.ClearDeleted = function(){
		bookmarkFactory.clearDeleted();
		$scope.Deleted = bookmarkFactory.loadDeleted();
	}
	
	/*  
	###########################################
	## Method used to restore a Deleted		 ##
	## Bookmark.                             ## 
	###########################################
	*/
	$scope.RestoreDeleted = function(index){
		var obj = $scope.Deleted[index];
		$scope.Bookmarks.push(obj);
		bookmarkFactory.restoreDeleted(index);
	}
	
	/*  
	###########################################
	## Method used to restore a Changed		 ##
	## Bookmark.                             ## 
	###########################################
	*/
	$scope.RestoreChanged = function(index){
		bookmarkFactory.restoreChanged(index);
		$scope.getChildren("0"); // Loads the bookmarks
	}
	
	/*  
	###########################################
	## Methods used for confirmation dialogs ## 
	###########################################
	*/
	  // Inlined template for demo
	var t = '<div class="modal-header">'+
		  '<h3>This is the title</h3>'+
		  '</div>'+
		  '<div class="modal-body">'+
		  '<p>Enter a value to pass to <code>close</code> as the result: <input ng-model="result" /></p>'+
		  '</div>'+
		  '<div class="modal-footer">'+
		  '<button ng-click="close(result)" class="btn btn-primary" >Close</button>'+
		  '</div>';

	$scope.opts = {
		backdrop: true,
		keyboard: true,
		backdropClick: true,
		template:  t,
		controller: 'TestDialogController'
	};
	
	$scope.openMessageBoxForDelete = function(bookmark, index){
		var title = 'Delete Bookmark';
		var msg = 'Are you sure you want to delete this bookmark?';
		var btns = [{result:'0', label: 'Cancel'}, {result:'1', label: 'OK', cssClass: 'btn-primary'}];

		$dialog.messageBox(title, msg, btns)
		  .open()
		  .then(function(result){
			if(result == '1')
				$scope.DeleteBookmark(bookmark, index);
		});
	};
	
	$scope.openMessageBoxForReplace = function(bookmark){
		var title = 'Replace Bookmark';
		var msg = 'Are you sure you want to replace this bookmark with your current tab?';
		var btns = [{result:'0', label: 'Cancel'}, {result:'1', label: 'OK', cssClass: 'btn-primary'}];

		$dialog.messageBox(title, msg, btns)
		  .open()
		  .then(function(result){
			if(result == '1')
				$scope.ReplaceBookmark(bookmark);
		});
	};
	
	// the dialog is injected in the specified controller
	function TestDialogController($scope, dialog){
	  $scope.close = function(result){
		dialog.close(result);
	  };
	}	
	$scope.Init();
});