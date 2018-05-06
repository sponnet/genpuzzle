var VoronoiDemo = {
    voronoi: new Voronoi(),
    sites: [],
    diagram: null,
    margin: 0,
    svg: null,
    bbox: {
        xl: 0,
        xr: 800,
        yt: 0,
        yb: 600
    },

    init: function() {

        this.randomSites(50, true);
        this.render();
        //var s = Snap("#svg");
        // Lets create big circle in the middle:
        //var bigCircle = this.svg.circle(150, 150, 100);
    },
    randomSites: function(n, clear) {
        if (clear) {
            this.sites = [];
        }
        // create vertices
        var xmargin = 800 * this.margin,
            ymargin = 600 * this.margin,
            xo = xmargin,
            dx = 800 - xmargin * 2,
            yo = ymargin,
            dy = 600 - ymargin * 2;
        for (var y = 0; y < 7; y++)
            for (var x = 0; x < 7; x++) {
                this.sites.push({
                    x: xo + x * dx / 7 + 0.1 * Math.random() * dx, //xo + Math.random() * dx + Math.random() / dx,
                    y: yo + y * dy / 7 + 0.15 * Math.random() * dy, //yo + Math.random() * dy + Math.random() / dy
                });
            }
        this.voronoi.recycle(this.diagram);
        this.diagram = this.voronoi.compute(this.sites, this.bbox);
        //this.updateStats();
    },
    disturb_hook: function(edge) {


        var start = new Point(edge.va);
        var end = new Point(edge.vb);


        var rv = (end - start).normalize();
        var nv = rv.rotate(90, new Point(0, 0));


        var h1 = start + rv * start.getDistance(end) / 2.5;
        var h2 = end - rv * start.getDistance(end) / 2.5;
        var h3 = (h2 + h1) / 2 + nv * h2.getDistance(h1);

        hooksize = h2.getDistance(h1);


        /*        var hooksize = 10;

                var h1 = start + (end - start) / 2 - rv * hooksize;
                var h2 = start + (end - start) / 2 + rv * hooksize;
                var h3 = (h2 + h1) / 2 + nv * hooksize * 2; //h2.getDistance(h1);
        */

        if (start.getDistance(end) > 60) {

            var path = new Path();
            path.strokeColor = '#f00';
            path.moveTo(start);
            path.lineTo(h1);


            /*
                        var c = new Path.Circle(h1, 1);
                        c.strokeColor = '#0f0';

                        c = new Path.Circle(h2, 1);
                        c.strokeColor = '#00f';

                        c = new Path.Circle(h3, 1);
                        c.strokeColor = '#f0f';
            */
            var path = new Path.Arc(h1, h3, h2);
            path.strokeColor = '#f00';


            var path = new Path();
            path.strokeColor = '#f00';
            path.moveTo(h2);
            path.lineTo(end);



        } else {
            var path = new Path();
            path.strokeColor = '#f00';
            path.moveTo(start);
            path.lineTo(end);

        }



    },
    disturb_hook2: function(edge) {


        var start = new Point(edge.va);
        var end = new Point(edge.vb);


        var rv = (end - start).normalize();
        var nv = rv.rotate(90, new Point(0, 0));


        var middle = start + (end - start) / 2;
        var size = start.getDistance(end) / 4;

        if (size > 10) {
            size = 20;
        }

        var h1 = middle - rv * size / 2;
        var h2 = middle + rv * size / 2;
        var h3 = middle + nv * size;

        var h4 = h1 + nv * size / 5;
        var h5 = h2 + nv * size / 5;

        if (size > 8) {

            var path = new Path();
            path.strokeColor = '#f00';
            path.moveTo(start);
            path.lineTo(h1);
            path.lineTo(h4);


            /*
                        var c = new Path.Circle(h1, 1);
                        c.strokeColor = '#0f0';

                        c = new Path.Circle(h2, 1);
                        c.strokeColor = '#00f';

                        c = new Path.Circle(h3, 1);
                        c.strokeColor = '#f0f';
            */
            var path = new Path.Arc(h4, h3, h5);
            path.strokeColor = '#f00';
            path.lineTo(h2);

            //            var path = new Path();
            //            path.strokeColor = '#f00';
            //            path.moveTo(h2);
            path.lineTo(end);


        } else {
            var path = new Path();
            path.strokeColor = '#f00';
            path.moveTo(start);
            path.lineTo(end);

        }



    },
    line: function(edge) {
        var start = new Point(edge.va);
        var end = new Point(edge.vb);
        var dpath = new Path();
        dpath.moveTo(start);
        //        dpath.add(start);

        dpath.strokeColor = 'green';
        dpath.lineTo(end);
    },

    disturb: function(edge) {
        var start = new Point(edge.va);
        var end = new Point(edge.vb);

        /*
                var path = new Path();
                path.strokeColor = '#aaa';
                path.moveTo(start);
                path.lineTo(end);
        */

        var dpath = new Path();
        dpath.moveTo(start);
        //        dpath.add(start);

        dpath.strokeColor = 'red';

        var segments = Math.floor((end - start).length / 5);
        var dx = (end.x - start.x) / segments;
        var dy = (end.y - start.y) / segments;

        var nv = (end - start).normalize().rotate(90, new Point(0, 0));

        if (segments > 1) {

            for (var s = 0; s < segments; s++) {
                var distance = 15 * Math.sin(Math.PI * s / segments) * Math.sin(Math.PI * s / segments);

                var rnd = Math.random();
                if (s & 1) {
                    rnd = rnd * -1;
                }
                if (s == 0 || s == segments) {
                    rnd = 0;
                }
                var p = new Point(start.x + dx * s + (nv.x * distance) * rnd, start.y + dy * s + (nv.y * distance) * rnd);

                //                var c = new Path.Circle(p, 1);
                //                c.strokeColor = '#444';

                dpath.add(p);

                //dpath.

            }
        }
        dpath.add(end);
        //        dpath.add(end);
        dpath.smooth();



    },
    render: function() {
        //this.svg = Snap("#svg");
        if (!this.diagram) {
            return;
        }

        var edges = this.diagram.edges,
            //            iEdge = edges.length,
            edge, v;
        for (var e = 0; e < edges.length; e++) {
            edge = edges[e];
            if (edge.rSite) {
                this.disturb_hook2(edge);
            } else {
                this.line(edge);
            }

        }
        //ctx.stroke();
        // edges
        //ctx.beginPath();
        //ctx.fillStyle = 'red';
        var vertices = this.diagram.vertices,
            iVertex = vertices.length;
        while (iVertex--) {
            v = vertices[iVertex];
            /*
            var l = this.svg.circle(v.x, v.y,4);
            l.attr({
                stroke: "#f00",
                strokeWidth: 4
            });
*/
        }
        var sites = this.sites,
            iSite = sites.length;
        while (iSite--) {
            v = sites[iSite];
        }

        //console.log(this.svg.toString());

        //     ctx.fill();
    },
};
VoronoiDemo.init();