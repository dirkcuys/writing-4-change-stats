// Enter a client ID for a web application from the Google Developer Console.
// The provided clientId will only work if the sample is run directly from
// https://google-api-javascript-client.googlecode.com/hg/samples/authSample.html
// In your Developer Console project, add a JavaScript origin that corresponds to the domain
// where you will be running the script.
var clientId = '145460447596-t38kgvlu39lmqau211p8svdsqicfqdu1.apps.googleusercontent.com';

// To enter one or more authentication scopes, refer to the documentation for the API.
var scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];


Array.prototype.indexOfOrAdd = function(key){
    if(this.indexOf(key) == -1){
        this.push(key);
    }
    return this.indexOf(key);
}


// Use a button to handle authentication the first time.
function handleClientLoad() {
  window.setTimeout(checkAuth,1);
}

function checkAuth() {
  gapi.auth.authorize({client_id: clientId, scope: scopes.join(' '), immediate: true}, handleAuthResult);
}


function handleAuthResult(authResult) {
  var authorizeButton = document.getElementById('authorize-button');
  if (authResult && !authResult.error) {
    authorizeButton.style.visibility = 'hidden';
    makeApiCall();
  } else {
    authorizeButton.style.visibility = '';
    authorizeButton.onclick = handleAuthClick;
  }
}

function handleAuthClick(event) {
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
  return false;
}

// Load the API and make an API call.  Display the results on the screen.
function makeApiCall() {
  gapi.client.load('plus', 'v1', function() {
    var request = gapi.client.plus.people.get({
      'userId': 'me'
    });
    request.execute(function(resp) {
      var heading = document.createElement('h4');
      var image = document.createElement('img');
      image.src = resp.image.url;
      heading.appendChild(image);
      heading.appendChild(document.createTextNode(resp.displayName));

      document.getElementById('content').appendChild(heading);
    });
  });

  gapi.client.load('drive', 'v2', function(){
    retrieveAllFiles(function(result){
      result.forEach(function(fileObj){
        var elem = document.createElement('li');
        elem.innerHTML = fileObj.title;
        if (fileObj.shared){
            // get stats
            getCollaborators(fileObj.id, function(collaborators){
              var collaboratorList = document.createElement('ul');
              collaborators.forEach(function(userName){
                  fileObj.ownerNames.forEach(function(ownerName){
                      if (ownerName != userName && userName != 'undefined'){
                        D3Graph.addLink(ownerName, userName);
                      }
                  });
                  var revElem = document.createElement('li');
                  revElem.innerHTML = userName;
                  collaboratorList.appendChild(revElem);
              });
              elem.appendChild(collaboratorList);
            });
        }
        //document.getElementById('filelist').appendChild(elem);
      });
    });
  });
}


// List all documents in the drive
function retrieveAllFiles(callback) {
  var retrievePageOfFiles = function(request, result) {
    request.execute(function(resp) {
      result = result.concat(resp.items);
      var nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.drive.files.list({
          'pageToken': nextPageToken
        });
        retrievePageOfFiles(request, result);
      } else {
        callback(result);
      }
    });
  }
  var initialRequest = gapi.client.drive.files.list();
  retrievePageOfFiles(initialRequest, []);
}

function getCollaborators(fileId, callback){
  getFileRevisions(fileId, function(revisions){
    var collaborators = [];
    revisions.items.forEach(function(revision){
        if (collaborators.indexOf('' + revision.lastModifyingUserName) == -1){
            collaborators.push('' + revision.lastModifyingUserName);
        }
    });
    callback(collaborators);
  });
}

function getFileRevisions(fileId, callback){
  var initialRequest = gapi.client.drive.revisions.list({'fileId': fileId});
  // TODO Get all pages
  initialRequest.execute(callback);
}

var names = ['Adam', 'Andrew', 'Angus', 'Brylie', 'Bob', 'Bryan', 'Bruce', 'Charles', 'Chris', 'Colin', 'Dirk', 'David', 'Drew'];
//, 'Emille', 'Evan', 'Ethan', 'Frank', 'Francois', 'Fred', 'Graig', 'Greg', 'Graham', 'Harry', 'Henry', 'Howard', 'Ignus', 'Ivan', 'Issiah', 'John', 'James', 'Jeff', 'Kevin', 'Kyle', 'Kim', 'Lennard', 'Leon', 'Lee', 'Mark', 'Mike', 'Manfred', 'Nathan', 'Nevin', 'Neil', 'Oscar', 'Oliver', 'Omar', 'Philip', 'Patrick', 'Peter', 'Quintin', 'Quepid', 'Qwaga', 'Richard', 'Randalph', 'Ricardo', 'Steven', 'Shane', 'Shaun', 'Travis', 'Trevor', 'Tony', 'Uhail', 'Ushaad', 'Umar', 'Vince', 'Viper', 'Van', 'William', 'Winston', 'Warren', 'Xavier', 'Xinadu', 'Xally', 'Yoris', 'Yoda', 'Yull', 'Zane', 'Zett', 'Zorba' ]

function randomName(){
    return names[Math.floor(Math.random()*names.length)];
};

function test_d3(link_count){
    if (parseInt(link_count) <= 0){
        return;
    }
    window.setTimeout(function(){
        D3Graph.addLink(randomName(), randomName());
        test_d3(--link_count);
    }, Math.random()*1000);
}
