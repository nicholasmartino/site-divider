import Vue from 'vue';
import Vuex from 'vuex';
import mapboxgl from "mapbox-gl";
import * as MapboxDraw from 'mapbox-gl-draw';
import { Threebox } from 'threebox-plugin';
import { updateDraw } from '../components/Map'
Vue.use(Vuex);


export const store = new Vuex.Store({
  state:{
    accessToken:
      "pk.eyJ1IjoibmljaG9sYXNtYXJ0aW5vIiwiYSI6ImNrMjVhOGphOTAzZGUzbG8wNHJhdTZrMmYifQ.98uDMnGIvn1zrw4ZWUO35g",
    widthRange: [6, 10],
    draw: null,
    mapbox: null,
    polygons: null
  },
  getters: {
    getDraw: state => {
        return state.draw
    }
  },
  mutations: {
    setRange: (state, value) => {
      state.widthRange = value
    },
    setDraw: (state, draw) => {
      state.draw = draw
    },
    loadMap: (state, mapbox) => {
      state.mapbox = mapbox
    },
    generatePolygons: (state, polygons) => {
      console.log(updateDraw(state.mapbox, state.draw, state.widthRange))
      state.polygons = polygons
    }
  },
  actions: {
    loadMap (context) {
      mapboxgl.accessToken = this.state.accessToken
      var mapbox = new mapboxgl.Map({
        container: "map",
        interactive: true,
        style:  "mapbox://styles/mapbox/light-v10",
        zoom: 13,
        center: [-122.845821, 49.177020],
        pitch: 60,
        bearing: 360,
        antialias: true,
        attributionControl: false
      }).on("style.load", () => {
        window.tb = new Threebox(
          mapbox,
          mapbox.getCanvas().getContext("webgl"), {
            defaultLights: true,
          }
        );

        if (mapbox.getLayer("custom_layer") == null) {

          mapbox.on('load', () => {

            // Add 3D terrain
            mapbox.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 20
            });

            // Add satellite map
            mapbox.addSource('xyz-tile',{
              'type': 'raster',
              'tiles': ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              'tileSize': 512,
            })
      
            mapbox.addLayer({
              'id': 'wms-test-layer',
              'type': 'raster',
              'source': 'xyz-tile',
              'paint': {
                'raster-opacity': 0.2,
              }
            })

            // add the DEM source as a terrain layer with exaggerated height
            mapbox.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

            // Add parcels layer source (CoV)
            mapbox.addSource('property-parcel-polygons', {
              'type': 'geojson',
              'data': 'https://raw.githubusercontent.com/nicholasmartino/vue-threebox/master/public/data/property-parcel-polygons.geojson',
            });

            // Add parcels layer source (Surrey)
            mapbox.addSource('property-parcel-polygons-surrey', {
              'type': 'geojson',
              'data': 'surrey-lots.json'
            })

            // Add Surrey parcels layer to map
            mapbox.addLayer({
              'id': 'property-parcel-polygons-surrey-shp',
              'type': 'fill',
              'source': 'property-parcel-polygons-surrey',
              'paint': {
                'fill-color': '#ffffff',
                'fill-opacity': 0.2
              }
            })

            // Add CoV parcels layer to map
            mapbox.addLayer({
              'id': 'property-parcel-polygons-shp',
              'type': 'fill',
              'source': 'property-parcel-polygons',
              'paint': {
                'fill-color': '#ffffff', // blue color fill
                'fill-opacity': 0.2,
              },
            });

            // The 'building' layer in the Mapbox Streets
            // vector tileset contains building height data
            // from OpenStreetMap.
            mapbox.addLayer({
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
          // mapbox.addLayer({
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
      context.commit('loadMap', mapbox)
    },
    setDraw (context) {
      // Add draw controls
      console.log("Add draw")
      const draw = new MapboxDraw({
        displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
        },
        defaultMode: 'draw_polygon'
      });
      this.state.mapbox.addControl(draw, 'top-left');
      context.commit('setDraw', draw)
    },
  }
})
