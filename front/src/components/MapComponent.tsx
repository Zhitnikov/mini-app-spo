import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface Props {
    events: any[];
    center?: [number, number];
    zoom?: number;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
}

export default function MapComponent({
    events,
    center = [59.9311, 30.3609],
    zoom = 11
}: Props) {

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            className="w-full h-full z-10"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {events.map((event) => {
                if (!event.latitude || !event.longitude) return null;
                return (
                    <Marker
                        key={event.id}
                        position={[event.latitude, event.longitude]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="p-1 max-w-[200px]">
                                <p className="font-bold text-sm mb-1">{event.title}</p>
                                <p className="text-xs text-slate-500 mb-2">{event.location}</p>
                                <Link
                                    to={`/events/${event.id}`}
                                    className="btn btn-primary btn-xs w-full"
                                >
                                    Подробнее
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            <MapController center={center} zoom={zoom} />
        </MapContainer>
    );
}
