<template>
  <div id="map"></div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import * as MapboxDraw from 'mapbox-gl-draw';
import threebox from "threebox-plugin/dist/threebox";
import { Threebox } from 'threebox-plugin';
import Pulse from "./Pulses/Pulse";
import * as turf from '@turf/turf';


let pulse = new Pulse(400, 4000, true);
threebox

export default {
  name: "ThreeboxExample",
  data() {
    return {
      accessToken:
        "pk.eyJ1IjoibmljaG9sYXNtYXJ0aW5vIiwiYSI6ImNrMjVhOGphOTAzZGUzbG8wNHJhdTZrMmYifQ.98uDMnGIvn1zrw4ZWUO35g",
    };
  },
  mounted() {
    mapboxgl.accessToken = this.accessToken;

    this.map = new mapboxgl.Map({
      container: "map",
      interactive: true,
      style:  "mapbox://styles/mapbox/light-v10",
      zoom: 16,
      center: [-123.1068658, 49.2626982],
      pitch: 60,
      bearing: 360,
      antialias: true,
      // attributionControl: false
    }).on("style.load", () => {
      window.tb = new Threebox(
        this.map,
        this.map.getCanvas().getContext("webgl"),
        {
          defaultLights: true,
        }
      );

      // let _this = this;

      // Add draw control
      if (this.map.getLayer("custom_layer") == null) {

        this.map.on('load', () => {

          // // Add 3D terrain
          // this.map.addSource('mapbox-dem', {
          //   'type': 'raster-dem',
          //   'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          //   'tileSize': 512,
          //   'maxzoom': 20
          // });
          //
          // // add the DEM source as a terrain layer with exaggerated height
          // this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

          // // Add parcels layer source (CoV)
          // this.map.addSource('property-parcel-polygons', {
          //   'type': 'geojson',
          //   'data': 'https://raw.githubusercontent.com/nicholasmartino/vue-threebox/master/public/data/property-parcel-polygons.geojson',
          // });
          //
          // // Add parcels layer to map
          // this.map.addLayer({
          //   'id': 'property-parcel-polygons-shp',
          //   'type': 'fill',
          //   'source': 'property-parcel-polygons',
          //   'paint': {
          //     'fill-color': '#0080ff', // blue color fill
          //     'fill-opacity': 0.2,
          //   },
          // });

          // The 'building' layer in the Mapbox Streets
          // vector tileset contains building height data
          // from OpenStreetMap.
          this.map.addLayer({
            'id': 'add-3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
              'fill-extrusion-color': '#aaa',

              // Use an 'interpolate' expression to
              // add a smooth transition effect to
              // the buildings as the user zooms in.
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                9,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                9,
                0,
                15.05,
                ['get', 'min_height']
              ],

              // 'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-opacity': 0.8,
            },
          });

        });

        // // Add spheres to map
        // this.map.addLayer({
        //   id: "custom_layer",
        //   type: "custom",
        //   renderingMode: "3d",
        //
        //   onAdd: function (map, mbxContext) {
        //     window.tb.add(_this.sphere(-123.1068658, 49.2626982));
        //     window.tb.add(_this.sphere(-123.1088658, 49.2626982));
        //
        //     let pulseObj = window.tb
        //       .Object3D({ obj: pulse, units: "meters" })
        //       .setCoords([-123.1068658, 49.2626982, 0]);
        //
        //     pulseObj.setAnchor("bottom-left");
        //
        //     window.tb.add(pulseObj);
        //   },
        //   render: function (gl, matrix) {
        //     window.tb.update();
        //     _this.animatePulse();
        //   },
        // });

      }
    });

    // Add draw controls
    const draw = new MapboxDraw();
    this.map.addControl(draw, 'top-right');


    // Calculate the area of drawn polygons
    function updateArea() {
        const data = draw.getAll();
        const answer = document.getElementById('calculated-area');
        if (data.features.length > 0) {
          const area = turf.area(data);

          // Restrict the area to 2 decimal points.
          const rounded_area = Math.round(area * 100) / 100;
          answer.innerHTML = `<p><strong>${rounded_area}</strong> m²</p>`;
        } else {
          answer.innerHTML = '';
          // if (e.type !== 'draw.delete')
          //   alert('Click the map to draw a polygon.');
      }
    }


    // Returns a list of centroids of multiple LineStrings
    function lineCentroids(lines) {
      const centroids = [];
      for (let i = 0; i < lines.features.length; i++) {
        const line = turf.lineString(lines.features[i])
        const ctr = turf.centroid(line['geometry']['coordinates'])
        centroids.push(ctr)
      }
      return centroids
    }


    // Returns points along a LineString divided according to a specified length in meters
    function divideLineString(line, length=100) {
      const chunks = turf.lineChunk(line, length, {units: 'meters'})
      return lineCentroids(chunks)
    }


    // Extract drawn shape and convert it to a polygon
    function getPolygonDrawn(){
      const data = draw.getAll()
      return turf.polygon(data.features[0]['geometry']['coordinates'])
    }


    // Extract internal skeleton of a shape
    function voronoiSkeleton(){
      const pol = getPolygonDrawn()
      const line = turf.polygonToLine(pol)
      const chunks = turf.lineChunk(line, 0.01)
      const centroids = lineCentroids(chunks)
      const centroids_gj = {
        "type": "FeatureCollection",
        "features": centroids
      }
      const voronoi = turf.voronoi(centroids_gj)
      // Iterate over voronoi polygons to extract segments inside drawing
      const voronoiLines = [];
      for (let i = 0; i < voronoi.features.length; i++) {
        const voronoiPolygon = turf.polygon(voronoi.features[i]['geometry']['coordinates']);
        const voronoiLine = turf.polygonToLine(voronoiPolygon)
        const voronoiSegments = turf.lineSegment(voronoiLine)
        for (let i = 0; i < voronoiSegments.features.length; i++) {
          const segmentCentroid = turf.centroid(voronoiSegments.features[i])
          if (turf.booleanContains(pol, segmentCentroid)) {
            voronoiLines.push(voronoiSegments.features[i])
          }
        }
      }
      const voronoiLinesGeoJSON = {
        "type": "FeatureCollection",
        "features": voronoiLines
      }
      const voronoiLinesCombined = turf.combine(voronoiLinesGeoJSON)
      const voronoiLinesSimplified = turf.simplify(voronoiLinesCombined,
        {tolerance: 5, mutate: true})
      return voronoiLinesSimplified
    }


    // Generate skeleton and buffer according to some number of iterations
    function bufferDrawSkeleton(skeleton) {
      const bufferedSkeletons = []
      for (let i = 0; i < 3; i++) {
        const skeletonBuffer = turf.buffer(skeleton, 30 * (i+1), {units: 'meters'})
        const dissolvedSkeleton = turf.dissolve(skeletonBuffer)
        bufferedSkeletons.push(turf.lineString(dissolvedSkeleton.features[0]['geometry']['coordinates'][0]))
      }
      return bufferedSkeletons
    }


    // Subdivide a drawn shape using Voronoi patterhs
    function subdivideShape(street_width=8) {
      const skeleton = voronoiSkeleton()
      const skeletonBufferSmall = turf.buffer(skeleton, 0.1, {units: 'meters'}).features[0]
      const skeletonLine = turf.polygonToLine(skeletonBufferSmall)
      const dividedSkeleton = divideLineString(turf.combine(skeletonLine))
      const voronoiSkeletonBuffers = bufferDrawSkeleton(skeleton)
      const perpendicularLines = []
      for (let i = 0; i < dividedSkeleton.length; i++) {
        var originalPoint = dividedSkeleton[i]
        const nearestPoints = [originalPoint['geometry']['coordinates']]
        for (let j = 0; j < voronoiSkeletonBuffers.length; j++) {
          const buffer = voronoiSkeletonBuffers[j]
          const nextPoint = turf.nearestPointOnLine(buffer, turf.point(originalPoint['geometry']['coordinates']))
          nearestPoints.push(nextPoint['geometry']['coordinates'])
          originalPoint = nextPoint
        }
        perpendicularLines.push(turf.lineString(nearestPoints))
      }
      // Buffer lines and subtract
      const centerlines = turf.featureCollection(perpendicularLines.concat(skeleton.features, voronoiSkeletonBuffers))
      return centerlines
    }

    const subdivided = subdivideShape()
    const bufferedCenterlines = turf.dissolve(turf.buffer(subdivided, street_width/2, {units: 'meters'}))
    const blocks = turf.difference(getPolygonDrawn(), bufferedCenterlines.features[0])

    this.map.on('draw.create', updateArea);
    this.map.on('draw.delete', updateArea);
    this.map.on('draw.update', updateArea);


    this.map.on('draw.create', () => {
      this.map.addSource('draw', {
        'type': 'geojson',
        'data': blocks,
      });
      this.map.addLayer({
        'id': 'outline',
        'type': 'polygon',
        'source': 'draw',
        'paint': {
          'line-color': '#F84C4C',
        }
      });
    });

    this.map.on('draw.delete', () => {
      this.map.removeLayer('outline')
      this.map.removeSource('draw')
    });

    this.map.on('draw.update', () => {
      this.map.removeLayer('outline')
      this.map.removeSource('draw')
      this.map.addSource('draw', {
        'type': 'geojson',
        'data': generateBlocks(),
      });
      this.map.addLayer({
        'id': 'outline',
        'type': 'line',
        'source': 'draw',
        'paint': {
          'line-color': '#F84C4C' // red color
        }
      });
    });

  },
  methods: {
    sphere(lon, lat) {
      let origin = [lon, lat, 0];
      return window.tb
        .sphere({ color: "red", material: "MeshToonMaterial" })
        .setCoords(origin);
    },
    animatePulse() {
      pulse.update();
      this.map.triggerRepaint();
    },
  },

};

</script>


<style>
#map {
  position: absolute;
  width: 100vw;
  height: 100vh;
}
@import "https://api.mapbox.com/mapbox-gl-js/v0.42.0/mapbox-gl.css";
@import "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.2.2/mapbox-gl-draw.css";
.mapboxgl-ctrl-group button {
    width: 29px;
    height: 29px;
    display: block;
    padding: 0;
    outline: none;
    border: 0;
    box-sizing: border-box;
    background-color: transparent;
    cursor: pointer;
    overflow: hidden;
}
.mapboxgl-ctrl-top-right {
    top: 0;
    right: 0;
    position: absolute;
}
</style>
