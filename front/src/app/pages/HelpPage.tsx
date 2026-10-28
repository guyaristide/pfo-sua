import { useNavigate } from 'react-router';
import { HelpScreen } from '@/ui/screens/HelpScreen';
import { targetPath } from '../targets';

export function HelpPage() {
  const navigate = useNavigate();
  return <HelpScreen onOpen={target => void navigate(targetPath(target))} />;
}
