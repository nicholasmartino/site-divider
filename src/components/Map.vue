<template>
  <div>
    <div id="map" v-on:draw="generatePolygons()"></div>
    <div id="vue-range-slider">
      <RangeSlider v-on:changeValue="generatePolygons()"/>
    </div>
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import * as MapboxDraw from 'mapbox-gl-draw';
import threebox from "threebox-plugin/dist/threebox";
import { Threebox } from 'threebox-plugin';
import Pulse from "./Pulses/Pulse";
import * as turf from '@turf/turf';
import RangeSlider from "./RangeSlider"


let pulse = new Pulse(400, 4000, true);
threebox


// Calculate the area of drawn polygons
export function updateArea(draw) {
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


// Returns true if finds a defined key in the input array of dictionaries
export function keyInDictionary (dictionaries, keyToFind) {
    for (var i in dictionaries) {
        if (dictionaries[i]['id'] == keyToFind) {
            return true
        }
    }
}


// Returns a list of centroids of multiple LineStrings
export function lineCentroids(lines) {
  const centroids = [];
  for (let i = 0; i < lines.features.length; i++) {
    const line = turf.lineString(lines.features[i])
    const ctr = turf.centroid(line['geometry']['coordinates'])
    centroids.push(ctr)
  }
  return centroids
}


// Returns points along a LineString divided according to a specified length in meters
export function divideLineString(line, length=100) {
  const chunks = turf.lineChunk(line, length, {units: 'meters'})
  return lineCentroids(chunks)
}


// Extract drawn shape and convert it to a polygon
export function getPolygonDrawn(draw){
  const data = draw.getAll()
  return turf.polygon(data.features[0]['geometry']['coordinates'])
}


// Extract internal skeleton of a shape
export function voronoiSkeleton(draw){
  const pol = getPolygonDrawn(draw)
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
export function bufferDrawSkeleton(skeleton) {
  const bufferedSkeletons = []
  for (let i = 0; i < 3; i++) {
    const skeletonBuffer = turf.buffer(skeleton, 30 * (i+1), {units: 'meters'})
    const dissolvedSkeleton = turf.dissolve(skeletonBuffer)
    bufferedSkeletons.push(turf.lineString(dissolvedSkeleton.features[0]['geometry']['coordinates'][0]))
  }
  return bufferedSkeletons
}


// Subdivide a drawn shape using Voronoi patterns
export function subdivideShape(draw) {
  const output = {}
  const skeleton = voronoiSkeleton(draw)
  output.skeleton = skeleton.features
  const skeletonBufferSmall = turf.buffer(skeleton, 0.1, {units: 'meters'}).features[0]
  const skeletonLine = turf.polygonToLine(skeletonBufferSmall)
  const dividedSkeleton = divideLineString(turf.combine(skeletonLine))
  const voronoiSkeletonBuffers = bufferDrawSkeleton(skeleton)
  output.voronoiSkeletonBuffers = voronoiSkeletonBuffers
  output.perpendicularLines = []
  for (let i = 0; i < dividedSkeleton.length; i++) {
    var originalPoint = dividedSkeleton[i]
    const nearestPoints = [originalPoint['geometry']['coordinates']]
    for (let j = 0; j < voronoiSkeletonBuffers.length; j++) {
      const buffer = voronoiSkeletonBuffers[j]
      const nextPoint = turf.nearestPointOnLine(buffer, turf.point(originalPoint['geometry']['coordinates']))
      nearestPoints.push(nextPoint['geometry']['coordinates'])
      originalPoint = nextPoint
    }
    output.perpendicularLines.push(turf.lineString(nearestPoints))
  }
  console.log(output)
  return output
}

// Buffer generated lines according to buffer range and subtract from original drawing
export function generateBlocks(draw, bufferRange) {
  const bufferOptions = {units: 'meters'}
  const subdivisions = subdivideShape(draw)
  const skeletonBuffer = turf.buffer(subdivisions.skeleton[0], bufferRange[1]/2, bufferOptions)
  const perpendicularsBuffered = turf.buffer(turf.featureCollection(subdivisions.perpendicularLines), (bufferRange[0] + bufferRange[1])/4, bufferOptions)
  const parallelsBuffered = turf.buffer(turf.featureCollection(subdivisions.voronoiSkeletonBuffers), bufferRange[0]/2, bufferOptions)
  const allBuffers = turf.featureCollection(perpendicularsBuffered.features.concat(parallelsBuffered.features, skeletonBuffer))
  const bufferedCenterlines = turf.dissolve(allBuffers)
  const difference = turf.difference(getPolygonDrawn(draw), bufferedCenterlines.features[0])
  return difference
}


export function deleteOutlineDraws(map) {
  if (keyInDictionary(map.getStyle().layers, 'outline')) {
    map.removeLayer('outline')
  }
  if ('draw' in map.getStyle().sources) {
    map.removeSource('draw')
  }
}


export function updateDraw(mapbox, draw, widthRange) {
  deleteOutlineDraws(mapbox)
  mapbox.addSource('draw', {
    'type': 'geojson',
    'data': generateBlocks(draw, widthRange),
  });
  mapbox.addLayer({
    'id': 'outline',
    'type': 'fill',
    'source': 'draw',
    'paint': {
      'fill-color': '#06be7f' // red color
    }
  });
}


export function createDraw(mapbox, draw, widthRange) {
  widthRange
  mapbox.addSource('draw', {
    'type': 'geojson',
    'data': generateBlocks(draw, widthRange),
  });
  mapbox.addLayer({
    'id': 'outline',
    'type': 'fill',
    'source': 'draw',
    'paint': {
      'fill-color': '#06be7f',
    }
  });
}


export default {
  name: "ThreeboxExample",

  mounted() {
    this.$store.dispatch('loadMap')
    this.$store.dispatch('setDraw')
    // this.$store.dispatch('generatePolygons')
    // this.initMap()
    // this.addDrawControls()
    this.generatePolygons()
  },
  computed: {
    accessToken(){
      return this.$store.state.accessToken
    },
    getDraw(){
      return this.$store.getters.draw
    },
    widthRange(){
      return this.$store.state.widthRange
    },
    getMap(){
      return this.$store.state.mapbox
    },
  },
  components: {
    RangeSlider
  },
  methods: {
    // loadMap (context) {
    //   mapboxgl.accessToken = this.state.accessToken
    //   var mapbox = new mapboxgl.Map({
    //     container: "map",
    //     interactive: true,
    //     style:  "mapbox://styles/mapbox/dark-v10",
    //     zoom: 16,
    //     center: [-123.1068658, 49.2626982],
    //     pitch: 60,
    //     bearing: 360,
    //     antialias: true,
    //     attributionControl: false
    //   })
    //   context.commit('loadMap', mapbox)
    // },
    // setDraw (context) {
    //   // Add draw controls
    //   const draw = new MapboxDraw();
    //   this.state.mapbox.addControl(draw, 'top-right');
    //   context.commit('setDraw', this.draw)
    // },
    sphere(lon, lat) {
      let origin = [lon, lat, 0];
      return window.tb
        .sphere({ color: "red", material: "MeshToonMaterial" })
        .setCoords(origin);
    },
    animatePulse() {
      pulse.update();
      this.mapbox.triggerRepaint();
    },
    initMap() {
      mapboxgl.accessToken = this.accessToken;
      this.mapbox = new mapboxgl.Map({
        container: "map",
        interactive: true,
        style:  "mapbox://styles/mapbox/dark-v10",
        zoom: 16,
        center: [-123.1068658, 49.2626982],
        pitch: 60,
        bearing: 360,
        antialias: true,
        attributionControl: false
      }).on("style.load", () => {
        window.tb = new Threebox(
          this.mapbox,
          this.mapbox.getCanvas().getContext("webgl"), {
            defaultLights: true,
          }
        );

        // Add draw control
        if (this.mapbox.getLayer("custom_layer") == null) {

          this.mapbox.on('load', () => {

            // // Add 3D terrain
            // this.mapbox.addSource('mapbox-dem', {
            //   'type': 'raster-dem',
            //   'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            //   'tileSize': 512,
            //   'maxzoom': 20
            // });
            //
            // // add the DEM source as a terrain layer with exaggerated height
            // this.mapbox.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

            // // Add parcels layer source (CoV)
            // this.mapbox.addSource('property-parcel-polygons', {
            //   'type': 'geojson',
            //   'data': 'https://raw.githubusercontent.com/nicholasmartino/vue-threebox/master/public/data/property-parcel-polygons.geojson',
            // });
            //
            // // Add parcels layer to map
            // this.mapbox.addLayer({
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
            this.mapbox.addLayer({
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
          // const _this = this
          // this.mapbox.addLayer({
          //   id: "custom_layer",
          //   type: "custom",
          //   renderingMode: "3d",
          //
          //   onAdd: function (map, mbxContext) {
          //     window.tb.add(_this.sphere(-123.1068658, 49.2626982));
          //     window.tb.add(_this.sphere(-123.1088658, 49.2626982));
          //     console.log(map)
          //     console.log(mbxContext)
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
          //     console.log(gl)
          //     console.log(matrix)
          //   },
          // });

        }
      });
      this.generatePolygons()
    },
    addDrawControls() {
      // Add draw controls
      this.mapbox = this.$store.state.mapbox
      const draw = new MapboxDraw();
      this.mapbox.addControl(draw, 'top-right');
      this.$store.commit('setDraw', this.draw)
      this.draw = draw
    },
    generatePolygons() {
      this.mapbox = this.$store.state.mapbox
      this.draw = this.$store.state.draw

      this.mapbox.on('draw.create', () => {
        updateArea(this.draw)
      })
      this.mapbox.on('draw.delete', () => {
        updateArea(this.draw)
      })
      this.mapbox.on('draw.update', () => {
        updateArea(this.draw)
      })

      this.mapbox.on('draw.create', () => {
        createDraw(this.mapbox, this.draw, this.widthRange)
      });

      this.mapbox.on('draw.delete', () => {
        deleteOutlineDraws(this.mapbox)
      });

      this.mapbox.on('draw.update', () => {
        updateDraw(this.mapbox, this.draw, this.widthRange)
      });
    }
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
@import "https://api.tiles.mapbox.com/mapbox-gl-js/v0.53.0/mapbox-gl.css";
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
.marker:before {
  content: "";
  cursor: pointer;
  position: absolute;
  width: 25px;
  height: 25px;
  border: 1px solid #ccc;
  border-radius: 75% 45% 75% 0%;
  background: #3498db;
  bottom: 0;
  transform-origin: 0% 100%;
  transform: rotate(-45deg) scale(1);
}
</style>
