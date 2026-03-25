import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface Props {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: Props) {
    const map = useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);

    return (lat && lng) ? (
        <Marker position={[lat, lng]} icon={icon} />
    ) : null;
}

export default function MapPickerComponent({ lat, lng, onChange }: Props) {
    const defaultPos: [number, number] = [59.9311, 30.3609]; // SPB
    const center: [number, number] = (lat && lng) ? [lat, lng] : defaultPos;

    return (
        <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 z-10">
            <MapContainer
                center={center}
                zoom={11}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker lat={lat} lng={lng} onChange={onChange} />
            </MapContainer>
        </div>
    );
}
