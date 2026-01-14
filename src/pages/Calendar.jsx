import { CalendarIcon } from '../components/Icons'

const Calendar = () => {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
          My Trips
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Manage your upcoming adventures
        </p>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ 
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'center',
            color: 'var(--primary-color)',
            opacity: 0.5
          }}>
            <CalendarIcon size={64} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            No trips scheduled
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Start planning your next adventure!
          </p>
          <button className="btn btn-primary">
            Plan a Trip
          </button>
        </div>
      </div>
    </div>
  )
}

export default Calendar
