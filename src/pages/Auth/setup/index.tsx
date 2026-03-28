import Button from '@/ui/atoms/Button';
import { useAppDispatch } from '@/app/hooks';
import { markFinishedGetStarted } from '@/domain/auth/authSlice';

const ChooseSetup = () => {
    const dispatch = useAppDispatch();
    return (
        <div className="p-6">
            <h2 className="text-lg font-semibold mb-2">Choose your initial setup</h2>
            <Button onClick={() => dispatch(markFinishedGetStarted())}>Continue</Button>
        </div>
    );
}

export default ChooseSetup;
