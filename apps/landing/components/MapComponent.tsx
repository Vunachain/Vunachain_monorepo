import React, { useMemo, useState } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, Popup, type MapMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { type FillLayer, type CircleLayer } from 'mapbox-gl';
import { type FeatureCollection } from 'geojson';
import { Plot } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapComponentProps {
    plots: Plot[];
    onPlotClick?: (plot: Plot) => void;
    showSatellite?: boolean;
    activeLayers?: string[];
}

const MapComponent: React.FC<MapComponentProps> = ({ plots, onPlotClick, showSatellite = true, activeLayers = [] }) => {
    const [viewState, setViewState] = useState({
        longitude: 37.9062,
        latitude: 0.0236,
        zoom: 6
    });

    const [popupInfo, setPopupInfo] = React.useState<Plot | null>(null);

    const geojsonData: FeatureCollection = useMemo(() => ({
        type: 'FeatureCollection',
        features: plots
            .filter(p => p.boundary)
            .map(p => ({
                type: 'Feature',
                geometry: p.boundary,
                properties: {
                    id: p.id,
                    name: p.name,
                    is_compliant: p.is_eudr_compliant,
                    farmer: p.farmer,
                    last_checked: p.last_checked_at,
                    ndvi_score: p.is_eudr_compliant ? 0.8 : 0.4
                }
            }))
    }), [plots]);

    const pointData: FeatureCollection = useMemo(() => ({
        type: 'FeatureCollection',
        features: plots
            .filter(p => !p.boundary && p.centroid)
            .map(p => ({
                type: 'Feature',
                geometry: p.centroid!,
                properties: {
                    id: p.id,
                    name: p.name,
                    is_compliant: p.is_eudr_compliant,
                    farmer: p.farmer,
                    last_checked: p.last_checked_at,
                    ndvi_score: p.is_eudr_compliant ? 0.8 : 0.4
                }
            }))
    }), [plots]);

    const hasNdvi = activeLayers.includes('ndvi');

    const layerStyle: FillLayer = {
        id: 'plot-boundaries',
        type: 'fill',
        paint: {
            'fill-color': hasNdvi
                ? [
                    'interpolate',
                    ['linear'],
                    ['get', 'ndvi_score'],
                    0, '#dc2626',
                    0.5, '#facc15',
                    1, '#16a34a'
                  ]
                : ['case', ['get', 'is_compliant'], '#22c55e', '#ef4444'],
            'fill-opacity': hasNdvi ? 0.7 : 0.5,
            'fill-outline-color': '#ffffff'
        },
        source: 'plots-source'
    };

    const pointLayerStyle: CircleLayer = {
        id: 'plot-points',
        type: 'circle',
        paint: {
            'circle-radius': 8,
            'circle-color': hasNdvi
                ? [
                    'interpolate',
                    ['linear'],
                    ['get', 'ndvi_score'],
                    0, '#dc2626',
                    0.5, '#facc15',
                    1, '#16a34a'
                  ]
                : ['case', ['get', 'is_compliant'], '#22c55e', '#ef4444'],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        },
        source: 'points-source'
    };

    const anomaliesData: FeatureCollection = useMemo(() => ({
        type: 'FeatureCollection',
        features: plots.slice(0, 3).map(p => ({
            type: 'Feature',
            geometry: p.centroid || (p.boundary as Record<string, unknown>)?.coordinates?.[0]?.[0]?.[0] ? {
                type: 'Point',
                coordinates: p.centroid?.coordinates || (p.boundary as Record<string, unknown>).coordinates[0][0][0]
            } : { type: 'Point', coordinates: [37.9, 0.02] },
            properties: {
                risk: 'High Pest Risk'
            }
        }))
    }), [plots]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-slate-500">
                <div>
                    <span className="material-symbols-outlined text-4xl mb-3">map_off</span>
                    <p className="font-bold">Mapbox Token Missing</p>
                    <p className="text-sm mt-1">Please add VITE_MAPBOX_TOKEN to your .env file to enable high-resolution satellite mapping.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative group">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle={showSatellite ? "mapbox://styles/mapbox/satellite-v9" : "mapbox://styles/mapbox/streets-v12"}
                onClick={(e: MapMouseEvent) => {
                    const feature = e.features?.[0];
                    if (feature && feature.layer && (feature.layer.id === 'plot-boundaries' || feature.layer.id === 'plot-points')) {
                        const plotId = feature.properties?.id;
                        const plot = plots.find(p => p.id === plotId);
                        if (plot) {
                            setPopupInfo(plot);
                            onPlotClick?.(plot);
                        }
                    } else if (!feature) {
                        setPopupInfo(null);
                    }
                }}
                interactiveLayerIds={['plot-boundaries', 'plot-points']}
            >
                <GeolocateControl position="top-left" />
                <NavigationControl position="top-left" />
                <FullscreenControl position="top-left" />
                <ScaleControl />

                <Source id="plots-source" type="geojson" data={geojsonData}>
                    <Layer {...layerStyle} />
                </Source>

                <Source id="points-source" type="geojson" data={pointData}>
                    <Layer {...pointLayerStyle} />
                </Source>

                {activeLayers.includes('pest') && (
                    <Source id="pest-source" type="geojson" data={anomaliesData}>
                        <Layer 
                            id="pest-heatmap"
                            type="heatmap"
                            paint={{
                                'heatmap-weight': 1,
                                'heatmap-intensity': 1,
                                'heatmap-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['heatmap-density'],
                                    0, 'rgba(33,102,172,0)',
                                    0.2, 'rgba(103,169,207,0.5)',
                                    0.4, 'rgba(209,229,240,0.8)',
                                    0.6, 'rgba(253,219,199,0.9)',
                                    0.8, 'rgba(239,138,98,1)',
                                    1, 'rgba(178,24,43,1)'
                                ],
                                'heatmap-radius': 40
                            }}
                        />
                    </Source>
                )}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.centroid?.coordinates?.[0] || (popupInfo.boundary as Record<string, unknown>)?.coordinates?.[0]?.[0]?.[0] || 37.9062}
                        latitude={popupInfo.centroid?.coordinates?.[1] || (popupInfo.boundary as Record<string, unknown>)?.coordinates?.[0]?.[0]?.[1] || 0.0236}
                        onClose={() => setPopupInfo(null)}
                        className="vunachain-map-popup"
                    >
                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg min-w-[200px]">
                            <h3 className="font-black text-slate-900 dark:text-white mb-1">{popupInfo.name}</h3>
                            <p className="text-xs text-slate-500 mb-3 font-medium">Farmer: {popupInfo.farmer}</p>
                            <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 w-fit ${popupInfo.is_eudr_compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                <span className="material-symbols-outlined text-[14px]">{popupInfo.is_eudr_compliant ? 'check_circle' : 'warning'}</span>
                                {popupInfo.is_eudr_compliant ? 'Compliant' : 'Risk Flagged'}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-4 italic border-t pt-2 border-gray-100 dark:border-gray-800">Verified: {new Date(popupInfo.last_checked_at).toLocaleDateString()}</p>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

export default MapComponent;
