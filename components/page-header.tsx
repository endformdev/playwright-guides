/** A dashboard page's title, a line about it, and optional controls. */
export function PageHeader({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-stone-900">
					{title}
				</h1>
				{description && (
					<p className="mt-1 text-sm text-stone-500">{description}</p>
				)}
			</div>
			{children}
		</div>
	);
}
