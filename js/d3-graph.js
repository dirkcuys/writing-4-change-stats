var D3Graph = (function(){

    var width = 1000, height = 600;
    var force = d3.layout.force();
    force
        .charge(-250)
        .linkDistance(100)
        .size([width, height]);

    var nodesData = force.nodes();
    var linkData = force.links();
    var svg = d3.select("svg")
        .attr("viewBox", "0 0 " + width + " " + height )
        .attr("preserveAspectRatio", "xMidYMid meet");

    var links = svg.selectAll(".link").data(linkData);
    var nodes = svg.selectAll(".node").data(nodesData);
    var labels = svg.selectAll(".labels").data(nodesData);

    force.on("tick", function(e){
        // Push nodes toward their designated focus.
        /*var k = .1 * e.alpha;
        nodesData.forEach(function(o, i){
            o.y += (height/2.0 - o.y) * k;
            o.x += (width/2.0 - o.x) * k;
        });*/
       
        nodes.attr("cx", function(d){ return d.x; })
            .attr("cy", function(d){ return d.y; });
        
        labels.attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")";
        });
            
        links
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    });


    function redraw(){
        var svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

        links = links.data(linkData);
        links.enter().append("line")
            .attr("class", "link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
            .style('stroke', '#9ecae1')
            .style('stroke-width', 1);

        nodes = nodes.data(nodesData);
        nodes.enter().append("circle")
            .attr("class", "node")
            .attr("cx", function(d){ return d.x; })
            .attr("cy", function(d){ return d.y; })
            .style({'fill': function(d){ return d3.rgb(255,255*Math.random(),64*Math.random()).toString() }})
            .attr("r", 8)
            .call(force.drag);

        labels = labels.data(nodesData);
        labels.enter().append('g')
            .attr('class', 'label')
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .append('text')
            .attr('pointer-events', 'none')
            .text(function(d){ return d.key; });

        force.start();
    }

    function getOrAddNode(key){
        for (var i=0; i<nodesData.length; ++i){
            if (nodesData[i].key == key){
                return nodesData[i];
            }
        }
        nodesData.push({key: key});
        return nodesData[nodesData.length-1];
    }

    Array.prototype.indexOfOrAdd = function(key){
        if(this.indexOf(key) == -1){
            this.push(key);
        }
        return this.indexOf(key);
    }

    return {
        addLink: function (sourceKey, targetKey, weight){
            var source = getOrAddNode(sourceKey);
            var target = getOrAddNode(targetKey);
            // TODO check for existing link first
            var link = {source: source, target: target};
            if (weight){
                link.weight = weight;
            }
            linkData.push(link);
            redraw();
        },
        debug: {
            links: linkData,
            nodes: nodesData
        }
    };
})();
