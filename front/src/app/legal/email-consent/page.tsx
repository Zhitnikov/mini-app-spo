import { useNavigate } from 'react-router-dom';

export default function EmailConsentPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col p-4 gap-4">
            <header className="flex items-center gap-2">
                <button className="btn btn-ghost btn-square btn-sm" onClick={() => navigate(-1)}>←</button>
                <h1 className="text-base font-bold">Согласие на email-уведомления</h1>
            </header>
            <div className="card bg-base-100 border border-base-300">
                <div className="card-body text-sm leading-relaxed">
                    <p>Вы даете согласие на обработку email для отправки сервисных писем по мероприятиям: билет с QR-кодом, напоминание за 24 часа и уведомления об изменениях мероприятия.</p>
                    <p>Email используется только в целях информирования в рамках работы сервиса и не передается третьим лицам, кроме технических подрядчиков доставки писем (SMTP-провайдер).</p>
                    <p>Согласие действует до его отзыва. Вы можете в любой момент изменить email или отключить согласие на странице мероприятия.</p>
                    <p>Оператор обработки: команда проекта СПО Мини. По вопросам удаления данных обращайтесь к администрации проекта.</p>
                </div>
            </div>
        </div>
    );
}
