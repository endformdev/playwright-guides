"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({ isFeatured }: { isFeatured?: boolean }) {
	const { pending } = useFormStatus();
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	return (
		<Button
			type="submit"
			disabled={pending || !isHydrated}
			variant={isFeatured ? "default" : "outline"}
			className="h-11 w-full rounded-full"
		>
			{pending ? (
				<>
					<Loader2 className="animate-spin mr-2 h-4 w-4" />
					Loading...
				</>
			) : (
				<>
					Get Started
					<ArrowRight className="ml-2 h-4 w-4" />
				</>
			)}
		</Button>
	);
}
