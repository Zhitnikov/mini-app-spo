import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function EventScanPage() {
    const navigate = useNavigate();
    const [qrPayload, setQrPayload] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [cameraEnabled, setCameraEnabled] = useState(true);

    const scan = async () => {
        if (!qrPayload) return;
        setLoading(true);
        setResult('');
        try {
            const res = await fetch('/api/events/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrPayload }),
            });
            const data = await res.json();
            if (!res.ok) {
                setResult(data.error || 'Ошибка сканирования');
                return;
            }
            setResult(data.alreadyVisited ? 'Участник уже был отмечен ранее' : 'Проход успешно подтвержден');
        } catch {
            setResult('Ошибка сети');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col p-4 gap-4">
            <header className="flex items-center gap-2">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                <h1 className="text-base font-bold">Сканер билетов</h1>
            </header>
            {cameraEnabled && (
                <div className="rounded-2xl overflow-hidden border border-base-300">
                    <Scanner
                        onScan={(detected) => {
                            const value = detected?.[0]?.rawValue;
                            if (!value) return;
                            setQrPayload(value);
                            setCameraEnabled(false);
                        }}
                        onError={() => null}
                    />
                </div>
            )}
            <textarea
                className="textarea textarea-bordered min-h-40"
                placeholder="Вставьте содержимое QR-кода"
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => setCameraEnabled((v) => !v)}>
                {cameraEnabled ? 'Скрыть камеру' : 'Включить камеру'}
            </button>
            <button className="btn btn-primary" onClick={scan} disabled={loading || !qrPayload}>
                {loading ? 'Проверяем...' : 'Проверить и отметить посещение'}
            </button>
            {result && <div className="alert"><span>{result}</span></div>}
        </div>
    );
}
