import { useRealtimeTools } from '../hooks/useRealtimeTools';
import './RealtimeIndicator.css';

/**
 * Shows a live indicator when tools are updated in real-time
 */
export default function RealtimeIndicator() {
  const { realtimeUpdate, liveIndicator } = useRealtimeTools();

  if (!liveIndicator || !realtimeUpdate) return null;

  const getEventLabel = (eventType) => {
    switch (eventType) {
      case 'INSERT':
        return '✨ New Tool Added';
      case 'UPDATE':
        return '🔄 Tool Updated';
      case 'DELETE':
        return '❌ Tool Removed';
      default:
        return '📡 Update';
    }
  };

  return (
    <div className={`realtime-indicator ${realtimeUpdate.type.toLowerCase()}`}>
      <span className="pulse"></span>
      <span className="message">
        {getEventLabel(realtimeUpdate.type)}: {realtimeUpdate.tool?.name}
      </span>
    </div>
  );
}
