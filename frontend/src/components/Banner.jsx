import './Banner.css';

export default function Banner({ tone = 'error', children }) {
  if (!children) return null;
  return <div className={`banner banner-${tone}`}>{children}</div>;
}
