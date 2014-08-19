// Enter a client ID for a web application from the Google Developer Console.
// The provided clientId will only work if the sample is run directly from
// https://google-api-javascript-client.googlecode.com/hg/samples/authSample.html
// In your Developer Console project, add a JavaScript origin that corresponds to the domain
// where you will be running the script.
var clientId = '585006561260-90e9ktc7m2vjh6e0k7e05jdp2qgbh1kj.apps.googleusercontent.com';

// To enter one or more authentication scopes, refer to the documentation for the API.
var scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

var collabData = [];
var authors = [];

var width = 500, height = 500;
var force; 
var link_data;

function updateD3(){
    link_data = [];
    authors.forEach(function (source, sourceIndex){
        if (collabData[sourceIndex] && collabData[sourceIndex].links){
            collabData[sourceIndex].links.forEach(function(target){
                link_data.push({
                    source: collabData[sourceIndex],
                    target: collabData[authors.indexOf(target)]
                });
            });
        }
    });

    var svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

    var links = svg.selectAll(".link").data(link_data);
    links.enter().append("line")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .style('stroke', '#9ecae1')
        .style('stroke-width', 1);

    var nodes = svg.selectAll("circle").data(collabData);

    force = d3.layout.force()
        .nodes(collabData)
        .charge(function(d){ return -0.5*d.r; })
        .links(link_data)
        .linkDistance(100)
        .gravity(0)
        .size([width/2.0, height/2.0]);

    nodes.enter().append("circle")
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; })
        .style({'fill': function(d){ return d3.rgb(255,255*Math.random(),64*Math.random()).toString() }})
        .attr("r", 8)
        .call(force.drag);


    force.on("tick", function(e){
        // Push nodes toward their designated focus.
        var k = .1 * e.alpha;
        collabData.forEach(function(o, i){
            o.y += (height/2.0 - o.y) * k;
            o.x += (width/2.0 - o.x) * k;
        });
       
        nodes.attr("cx", function(d){ return d.x; })
            .attr("cy", function(d){ return d.y; });
            //labels.attr("transform", function(d){ return "translate(" + d.x + "," + d.y + ")"; });
            
        links
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    });
            
    force.start()

}


Array.prototype.indexOfOrAdd = function(key){
    if(this.indexOf(key) == -1){
        this.push(key);
    }
    return this.indexOf(key);
}


function addCollabLink(from, to){
    var fI = authors.indexOfOrAdd(from);
    var tI = authors.indexOfOrAdd(to);
    if (collabData[fI] == undefined){
        collabData[fI] = {"label": from, "links": []};
    }
    if (collabData[tI] == undefined){
        collabData[tI] = {"label": to, "links": []};
    }
    collabData[fI].links.indexOfOrAdd(to);
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
                      if (ownerName != userName){
                        addCollabLink(ownerName, userName);
                        updateD3();
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
