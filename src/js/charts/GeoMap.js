'use strict';

const ajax = require( 'xdr' );
const Highcharts = require( 'highcharts/js/highmaps' );
const outlines = require( '../utils/state-outlines' );
const colorRange = require( '../utils/color-range' );
require( 'highcharts/js/modules/accessibility' )( Highcharts );

Highcharts.setOptions( {
  lang: {
    thousandsSep: ','
  }
} );

class GeoMap {

  constructor( { el, metadata, data, color, title, desc, shapes } ) {

    this.chartOptions = {
      credits: false,
      title: {
        text: ''
      },
      animation: {
        duration: 2000,
        easing: 'easeOutBounce'
      },
      legend: false,
      description: desc,
      mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: false
      },
      accessibility: {
        keyboardNavigation: {
          skipNullPoints: true
        },
        pointDescriptionFormatter: function( point ) {
          var percent = Math.round( point.value * 10 ) / 10;
          return `${ point.name } is at ${ percent }%`;
        },
        seriesDescriptionFormatter: function( series ) {
          return '30 day delinquent mortgages';
        },
        screenReaderSectionFormatter: () => 'Map showing 30-day delinquent mortgages in the United States.'
      },
      tooltip: {
        useHTML: true,
        formatter: function() {
          var percent = Math.round( this.point.value * 10 ) / 10;
          if ( !this.point.name ) {
            return `${ percent }%`;
          }
          return `<div><h5>${ this.point.name }</h5><strong>${ percent }%<strong> mortgage delinquency rate</div>`;
        }
      },
      states: {
        hover: {
          brightness: 0
        }
      },
      colorAxis: {
        dataClasses: colorRange[color]
      },
      series: this.constructor.getSeries( data, shapes )
    };

    this.chart = Highcharts.mapChart( el, Object.assign( {}, this.chartOptions ) );
  }

  static getSeries( data, shapes ) {
    const usMap = Highcharts.geojson( shapes ),
          borders = Highcharts.geojson( outlines, 'mapline' ),
          rows = data[0].data,
          points = [];


    usMap.forEach( mapPoint => {
      if ( rows[mapPoint.properties.id] ) {
        mapPoint.name = rows[mapPoint.properties.id].name;
        points.push( mapPoint );
      }
    } );

    data = Object.keys( rows ).map( row => ( {
      fips: row,
      name: rows[row].name,
      value: rows[row].value * 100
    } ) );

    const series = [
      {
        type: 'mapline',
        name: 'Borders',
        data: borders,
        enableMouseTracking: false,
        states: {
          hover: {
            enabled: false
          }
        }
      },
      {
        mapData: points,
        data: data,
        joinBy: [ 'id', 'fips' ],
        states: {
          hover: {
            enabled: false
          }
        }
      }
    ];

    return series;
  }

  update( newOptions ) {
    if ( newOptions.data ) {
      newOptions.series = this.constructor.getSeries( newOptions.data, newOptions.shapes );
    }
    // Merge the old chart options with the new ones
    Object.assign( this.chartOptions, newOptions );
    this.chart.update( this.chartOptions, true, true );
    this.chart.hideLoading();
  }

}

module.exports = GeoMap;