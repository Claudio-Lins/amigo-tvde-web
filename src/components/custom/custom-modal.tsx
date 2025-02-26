import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface CustomModalProps {
	children: React.ReactNode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	description?: string;
	trigger?: React.ReactNode;
	className?: string;
	closeButton?: boolean;
	closeButtonText?: string;
	closeButtonIcon?: React.ReactNode;
}

export function CustomModal({
	children,
	open,
	onOpenChange,
	title,
	description,
	trigger,
	className,
	closeButton,
	closeButtonText,
	closeButtonIcon,
}: CustomModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className={cn(className)}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children}
				{closeButton && (
					<DialogClose asChild>
						<Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
							{closeButtonText}
							{closeButtonIcon}
						</Button>
					</DialogClose>
				)}
			</DialogContent>
		</Dialog>
	);
}
