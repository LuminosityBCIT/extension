// TODO(DEVELOPER): Change the values below using values from the initialization snippet: Firebase Console > Overview > Add Firebase to your web app.
// Initialize Firebase
var config = {
  apiKey: 'AIzaSyCvPwGe93Z5ysoPNuU_QZeHRuyOQkqf5MU',
  databaseURL: 'https://luminosity-4dc48.firebaseio.com',
  storageBucket: 'luminosity-4dc48.appspot.com'
};
firebase.initializeApp(config);

/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
  // Listen for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      // [START_EXCLUDE]
      document.getElementById('quickstart-button').textContent = 'Sign out';
      document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
      document.getElementById('quickstart-account-details').textContent = displayName;//JSON.stringify(user, null, '  ');
      document.getElementById('signedInSection').style.display = "block";
      // [END_EXCLUDE]
    } else {
      // Let's try to get a Google auth token programmatically.
      // [START_EXCLUDE]
      document.getElementById('quickstart-button').textContent = 'Sign-in with Google';
      document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
      document.getElementById('quickstart-account-details').textContent = 'null';
      document.getElementById('signedInSection').style.display = "none";
      // [END_EXCLUDE]
    }
    document.getElementById('quickstart-button').disabled = false;
  });
  // [END authstatelistener]

  document.getElementById('quickstart-button').addEventListener('click', startSignIn, false);

  //
  //  Add Sync button for adding bookmark
  //  
  //  by Kaylie S.
  //
  document.getElementById('syncButton').addEventListener('click', function() {

    //
    //  Retrieve bookmarks from Chrome
    //  
    var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {

      //
      //  Clean up some unnecessary data from Chrome bookmark
      //  
      var simplifiedJSON = bookmarkTreeNodes[0].children[0].children;
      var bookmarkData = [];
      var folderData = [];

      for (var i = 0; i < simplifiedJSON.length; i++)
      {
          var oldBookmark = simplifiedJSON[i];
          
          //
          //    If bookmark element is a folder, so has children
          //
          if (oldBookmark.children)
          {
              //
              //  generate random folder key
              //
              var thisFolderKey = makeid();

              //
              // Create Folder data 
              //
              var thisFolder = {};
              thisFolder["folder_name"] = oldBookmark.title;
              thisFolder["folder_key"] = thisFolderKey;

              //
              //  save it in array
              //
              folderData.push(thisFolder);

              //
              //    run forloop for children so that child bookmark can also be stored
              //
              for (var j = 0; j < oldBookmark.children.length; j++)
              {
                  var childBookMark = oldBookmark.children[j];
                  
                  //
                  //    only if bookmark valid has title and url
                  //
                  if (childBookMark.title && childBookMark.url)
                  {
                      var bookmark = {};

                      bookmark["title"] = childBookMark.title;
                      bookmark["url"] = childBookMark.url;

                      //
                      //  Store with folder key that was generated
                      //
                      bookmark["folderkey"] = thisFolderKey;

                      bookmarkData.push(bookmark);   
                  }
              }
          }
          else {
              
              //
              //    only if bookmark valid has title and url
              //
              if (oldBookmark.title && oldBookmark.url)
              {
                  var bookmark = {};

                  bookmark["title"] = oldBookmark.title;
                  bookmark["url"] = oldBookmark.url;
                  bookmark["folderkey"] = "unorganized";

                  bookmarkData.push(bookmark); 
              }  
          }
      }
      //
      //  Show if it is synced or not!
      //
      document.getElementById('bookmarkdetail').textContent = "Bookmark was successfully synced";//JSON.stringify(bookmarkData, null, ' ');

      //
      //  Firebase Database synchronization
      //
      var database = firebase.database();
      if (firebase.auth().currentUser)
      {
        //
        //  Database "users/USER_ID/bookmarks/JSON_BOOKMARK_DATA"
        //
        database.ref("users/" + firebase.auth().currentUser.uid + "/bookmarks").set(bookmarkData);

        //
        //  Database "users/USER_ID/folders/JSON_ARRAY_FOLDER_DATA"
        //
        database.ref("users/" + firebase.auth().currentUser.uid + "/folders").set(folderData);
      }
    });
  });
  //
  //  End of Kaylie's modification
  //  
}

//
//  A method to generate random string for folder key
//  Reference: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
//
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 20; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
function startAuth(interactive) {
  // Request an OAuth token from the Chrome Identity API.
  chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
    if (chrome.runtime.lastError && !interactive) {
      console.log('It was not possible to get a token programmatically.');
    } else if(chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (token) {
      // Authrorize Firebase with the OAuth Access Token.
      var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
      firebase.auth().signInWithCredential(credential).catch(function(error) {
        // The OAuth token might have been invalidated. Lets' remove it from cache.
        if (error.code === 'auth/invalid-credential') {
          chrome.identity.removeCachedAuthToken({token: token}, function() {
            startAuth(interactive);
          });
        }
      });
    } else {
      console.error('The OAuth Token was null');
    }
  });
}

/**
 * Starts the sign-in process.
 */
function startSignIn() {
  document.getElementById('quickstart-button').disabled = true;
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    startAuth(true);
  }
}

window.onload = function() {
  initApp();
};