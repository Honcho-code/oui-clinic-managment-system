import { useAuth } from '../../context/AuthContext';
import MessageThread from '../../components/MessageThread';
import './Student.css';

export default function StudentMessages() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Messages</h1>
      <p className="muted" style={{ marginTop: 6, marginBottom: 32 }}>
        Message the clinic directly — for non-urgent questions about an appointment,
        a diagnosis, or a prescription. For anything urgent, visit the clinic in person.
      </p>
      <MessageThread studentId={user.id} canPrescribe={false} />
    </div>
  );
}
