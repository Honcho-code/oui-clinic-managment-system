import './Field.css';

export default function Field({ label, htmlFor, helper, error, required, children }) {
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required && <span className="field-required"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-message field-message-error">{error}</p>
      ) : helper ? (
        <p className="field-message">{helper}</p>
      ) : null}
    </div>
  );
}
