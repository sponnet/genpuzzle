import React, { Component } from "react";
import Voronoi from "voronoi";
import makerjs from "makerjs";
import { Point } from "paper";
import Prando from "prando";
import "bulma/css/bulma.css";
// import "bulma-extensions/bulma-slider/dist/css/bulma-slider.min.css";
// import "bulma-extensions/bulma-slider/dist/js/bulma-slider.min.js";
import "bulma-extensions/bulma-checkradio/dist/css/bulma-checkradio.min.css";

class N extends Component {
  constructor(props) {
    super();

    // random number generator
    this.rng = new Prando();

    this.pieces = 50;
    this.relaxit = true;

    this.state = {
      relaxit: this.relaxit,
      pieces: this.pieces,
      stats_pieces: undefined,
      stats_arcs: undefined
    };
  }

  componentDidMount() {
    const svgc = this.refs.svgcontainer;

    this.bbox = {
      xl: 0,
      xr: svgc.clientWidth,
      yt: 0,
      yb: Math.floor((svgc.clientWidth / 800) * 600)
    };

    this.init();
  }

  changePieces(amount) {
    // debugger;
    this.pieces = amount;
    this.setState({
      pieces: amount
    });
    this.randomSites();
    this.renderVornoi();
  }

  //----

  init() {
    if (!this.bbox) {
      return;
    }

    this.voronoi = new Voronoi();

    this.diagram = null;
    this.margin = 0;
    this.svg = null;

    this.randomSites();
    this.renderVornoi();
  }

  randomSites() {
    //debugger;
    const margin = 0.1; //percent

    // const xl = (this.bbox.xr * margin) / 100;
    // const xr = (this.bbox.xr * (100 - 2 * margin)) / 100;
    // const yt = (this.bbox.yb * margin) / 100;
    // const yb = (this.bbox.yb * (100 - 2 * margin)) / 100;

    const xmargin = this.bbox.xr * this.margin;
    const ymargin = this.bbox.yb * this.margin;
    const xo = xmargin;
    const dx = this.bbox.xr - xmargin * 2;
    const yo = ymargin;
    const dy = this.bbox.yb - ymargin * 2;

    this.sites = [];
    for (var i = 0; i < this.pieces; i++) {
      this.sites.push({
        x: Math.round((xo + Math.random() * dx) * 10) / 10,
        y: Math.round((yo + Math.random() * dy) * 10) / 10
      });
    }

    this.voronoi.recycle(this.diagram);
    this.diagram = this.voronoi.compute(this.sites, this.bbox);
    this.relaxSites();
  }

  // manipulate the edge
  draw_edge(edge) {
    // some helper functions
    const overlapsWithOtherArc = arcToTest => {
      const bboxArc = makerjs.measure.pathExtents(arcToTest);

      for (let i = 0; i < this.arcbounds.length; i++) {
        if (
          makerjs.measure.isMeasurementOverlapping(this.arcbounds[i], bboxArc)
        ) {
          // store arc to detect collisions later
          this.arcbounds.push(bboxArc);
          return true;
        }
      }
      // store arc to detect collisions later
      this.arcbounds.push(bboxArc);
      return false;
    };

    // is this edge too small to contain a tip ?
    const isEdgeTooSmall = size => {
      return size < this.bbox.xr / 90;
    };

    const arcFallsOutsideOfBoundingBox = arc => {
      const puzzleBoundingBox = new makerjs.models.Rectangle(
        this.bbox.xr,
        this.bbox.yb
      );
      const arcBoundingBox = makerjs.measure.pathExtents(arc);
    };

    const pointFallsOutsideOfBoundingBox = point => {
      if (point.x < this.bbox.xl || point.x > this.bbox.xr) return true;
      if (point.y < this.bbox.yt || point.y > this.bbox.yb) return true;
      return false;
    };

    const tryEdge = (start, end) => {
      var size = start.getDistance(end) / 4;

      // max size of the puzzle tip to avoid too large ones..
      if (size > this.bbox.xr / 5) {
        size = this.bbox.xr / 5;
      }

      // the tip consists of 5 points.
      // a circle arc is drawn from H4 to H5 through H3
      //          _ H3_
      //         /     \
      //        H4    H5
      //        |      |
      // start__H1    H2___end
      //

      // direction vector
      var rv = end.subtract(start).normalize();

      // normal vector
      var nv = rv.rotate(90, new Point(0, 0));

      var middle = start.add(end.subtract(start).divide(2));

      var h1 = middle.subtract(rv.multiply(size).divide(4));
      var h2 = middle.add(rv.multiply(size).divide(4));
      var h3 = middle.add(nv.multiply(size));

      var h4 = h1.add(nv.multiply(size).divide(5));
      var h5 = h2.add(nv.multiply(size).divide(5));

      const arc = new makerjs.paths.Arc(
        [h4.x, h4.y],
        [h3.x, h3.y],
        [h5.x, h5.y]
      );

      if (
        !overlapsWithOtherArc(arc) &&
        !isEdgeTooSmall(size) &&
        !pointFallsOutsideOfBoundingBox(h3)
      ) {
        // now draw the edge
        this.pathArray.push(
          new makerjs.paths.Line([start.x, start.y], [h1.x, h1.y])
        );
        this.pathArray.push(new makerjs.paths.Line([h1.x, h1.y], [h4.x, h4.y]));
        this.pathArray.push(arc);
        this.pathArray.push(new makerjs.paths.Line([h5.x, h5.y], [h2.x, h2.y]));
        this.pathArray.push(
          new makerjs.paths.Line([h2.x, h2.y], [end.x, end.y])
        );
        return true;
      } else {
        // can't make an edge here , it would be in the way
        return false;
      }
    };

    var start = new Point(edge.va);
    var end = new Point(edge.vb);

    // try drawing an edge from
    if (tryEdge(start, end)) {
      return true;
    }

    // try drawing an edge the other way
    if (tryEdge(end, start)) {
      return true;
    }

    // not possible - just draw a line then
    this.pathArray.push(
      new makerjs.paths.Line([start.x, start.y], [end.x, end.y])
    );
  }

  line(x0, y0, x1, y1) {
    this.pathArray.push(new makerjs.paths.Line([x0, y0], [x1, y1]));
  }

  relaxSites() {
    // debugger;
    if (!this.diagram) {
      return;
    }
    var cells = this.diagram.cells,
      iCell = cells.length,
      cell,
      site,
      sites = [],
      again = false,
      rn,
      dist;
    var p = (1 / iCell) * 0.1;
    while (iCell--) {
      cell = cells[iCell];
      rn = Math.random();
      // probability of apoptosis
      if (rn < p) {
        continue;
      }
      site = this.cellCentroid(cell);
      dist = this.distance(site, cell.site);
      again = again || dist > 1;
      // don't relax too fast
      // if (dist > 2) {
      //   site.x = (site.x + cell.site.x) / 2;
      //   site.y = (site.y + cell.site.y) / 2;
      // }
      // probability of mytosis
      if (rn > 1 - p) {
        dist /= 2;
        sites.push({
          x: site.x + (site.x - cell.site.x) / dist,
          y: site.y + (site.y - cell.site.y) / dist
        });
      }
      sites.push(site);
    }
    this.diagram = this.voronoi.compute(sites, this.bbox);

    this.renderVornoi();

    if (this.relaxit) {
      setTimeout(() => {
        this.relaxSites();
      }, 0);
    }
  }

  distance(a, b) {
    var dx = a.x - b.x,
      dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  cellArea(cell) {
    var area = 0,
      halfedges = cell.halfedges,
      iHalfedge = halfedges.length,
      halfedge,
      p1,
      p2;
    while (iHalfedge--) {
      halfedge = halfedges[iHalfedge];
      p1 = halfedge.getStartpoint();
      p2 = halfedge.getEndpoint();
      area += p1.x * p2.y;
      area -= p1.y * p2.x;
    }
    area /= 2;
    return area;
  }

  cellCentroid(cell) {
    var x = 0,
      y = 0,
      halfedges = cell.halfedges,
      iHalfedge = halfedges.length,
      halfedge,
      v,
      p1,
      p2;
    while (iHalfedge--) {
      halfedge = halfedges[iHalfedge];
      p1 = halfedge.getStartpoint();
      p2 = halfedge.getEndpoint();
      v = p1.x * p2.y - p2.x * p1.y;
      x += (p1.x + p2.x) * v;
      y += (p1.y + p2.y) * v;
    }
    v = this.cellArea(cell) * 6;
    return { x: x / v, y: y / v };
  }

  renderVornoi() {
    if (!this.diagram) {
      return;
    }

    this.pathArray = [];
    this.arcbounds = [];

    var edges = this.diagram.edges;

    for (var e = 0; e < edges.length; e++) {
      const edge = edges[e];
      if (edge.rSite) {
        this.draw_edge(edge);
      } else {
        // it's an edge of the puzzle
      }
    }
    //debugger;
    // add bounding box
    this.line(this.bbox.xl, this.bbox.yt, this.bbox.xr, this.bbox.yt);
    this.line(this.bbox.xr, this.bbox.yt, this.bbox.xr, this.bbox.yb);
    this.line(this.bbox.xr, this.bbox.yb, this.bbox.xl, this.bbox.yb);
    this.line(this.bbox.xl, this.bbox.yb, this.bbox.xl, this.bbox.yt);

    var svg = makerjs.exporter.toSVG(this.pathArray);
    //document.write(svg);

    // let blob = new Blob([svg], { type: "image/svg+xml" });
    // let url = URL.createObjectURL(blob);
    const svgc = this.refs.svgcontainer;
    // debugger;
    svgc.innerHTML = svg;
    // svgc.src = url;

    this.setState({
      stats_pieces: this.sites.length
    });
  }

  downloadsvg() {
    const fileName = `puzzle-${Date.now()}.svg`;
    const svg = makerjs.exporter.toSVG(this.pathArray);
    this.download(fileName, svg);
  }

  //   downloaddxf(){
  //     const fileName = `puzzle-${Date.now()}.dxf`;
  //     debugger;
  //     const svg = makerjs.exporter.toDXF(this.pathArray,{});
  //   this.download(fileName,svg);
  // }

  download(filename, text) {
    var element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  //----

  render() {
    // this.init();
    return (
      <div>
        <div className="columns is-vcentered">
          <div ref="svgcontainer" className="column is-fullheight is-8" />
          <div className="column is-4 is-offset-1">
            <h1 className="title is-2">Jigzaw puzzle generator</h1>
            <h2 className="subtitle is-4">
              Creates a random puzzle to lasercut
            </h2>
            <br />

            <div className="field">
              <label className="label">Pieces: {this.state.pieces}</label>
              <div className="has-text-centered control">
                <input
                  onChange={e => {
                    this.changePieces(e.target.value);
                  }}
                  className="slider is-success"
                  step="1"
                  min="4"
                  max="200"
                  value={this.state.pieces}
                  type="range"
                />
              </div>
            </div>

            <p className="has-text-centered">
              <div class="field">
                <input
                  class="is-checkradio"
                  onChange={e => {
                    this.relaxit = e.target.checked;
                    if (this.relaxit) {
                      this.relaxSites();
                    }
                    this.setState({ relaxit: e.target.checked });
                  }}
                  id="exampleCheckboxDefault"
                  type="checkbox"
                  name="exampleCheckboxDefault"
                  checked={this.state.relaxit}
                />
                <label for="exampleCheckboxDefault">
                  Relax it {this.state.relaxit}
                </label>
              </div>
            </p>
            <br />
            <a
              className="button is-medium is-info is-outlined"
              onClick={() => {
                this.init();
              }}
            >
              Another one!
            </a>

            {this.state.stats_pieces && (
              <>
                <br />
                <br />
                <h2 className="subtitle is-4">Export as</h2>

                <button
                  className="button is-medium is-info is-outlined"
                  onClick={() => {
                    this.downloadsvg();
                  }}
                >
                  SVG
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default N;
