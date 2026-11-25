import { Suspense, use } from "react";
import { processPayment } from "@/lib/payments/actions";

function CheckoutForm({
	searchParams,
}: {
	searchParams: Promise<{ plan?: string; amount?: string }>;
}) {
	const resolvedParams = use(searchParams);
	const planName = resolvedParams.plan || "Unknown Plan";
	const amount = Number(resolvedParams.amount) || 0;

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
				<h1 className="mb-2 text-3xl font-extrabold tracking-tight text-stone-900">
					Complete Your Purchase
				</h1>
				<p className="mb-8 text-stone-600">
					You are purchasing: <strong>{planName}</strong> for{" "}
					<strong>${amount / 100}/month</strong>
				</p>

				<form action={processPayment} className="space-y-6">
					<input type="hidden" name="planName" value={planName} />
					<input type="hidden" name="amount" value={amount} />

					<div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
						<p className="text-sm text-amber-900">
							<strong>Demo Payment System:</strong> This is a dummy payment form
							for testing purposes. Only 8-digit card numbers are accepted to
							prevent real credit card usage.
						</p>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<div>
							<h3 className="mb-4 text-base font-bold text-stone-900">
								Payment Information
							</h3>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="cardHolderName"
										className="block text-sm font-medium text-stone-700"
									>
										Card Holder Name
									</label>
									<input
										type="text"
										id="cardHolderName"
										name="cardHolderName"
										required
										className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
										placeholder="John Doe"
									/>
								</div>

								<div>
									<label
										htmlFor="cardNumber"
										className="block text-sm font-medium text-stone-700"
									>
										Card Number (8 digits only)
									</label>
									<input
										type="text"
										id="cardNumber"
										name="cardNumber"
										required
										maxLength={8}
										pattern="\d{8}"
										className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
										placeholder="12345678"
									/>
									<p className="mt-1 text-xs text-stone-500">
										Example: 12345678 (for demo purposes only)
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="expiryDate"
											className="block text-sm font-medium text-stone-700"
										>
											Expiry Date
										</label>
										<input
											type="text"
											id="expiryDate"
											name="expiryDate"
											required
											placeholder="MM/YY"
											pattern="\d{2}\/\d{2}"
											className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
										/>
									</div>

									<div>
										<label
											htmlFor="cvv"
											className="block text-sm font-medium text-stone-700"
										>
											CVV
										</label>
										<input
											type="text"
											id="cvv"
											name="cvv"
											required
											maxLength={3}
											pattern="\d{3}"
											className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
											placeholder="123"
										/>
									</div>
								</div>
							</div>
						</div>

						<div>
							<h3 className="mb-4 text-base font-bold text-stone-900">
								Billing Address
							</h3>

							<div className="space-y-4">
								<div>
									<label
										htmlFor="billingAddress"
										className="block text-sm font-medium text-stone-700"
									>
										Street Address
									</label>
									<input
										type="text"
										id="billingAddress"
										name="billingAddress"
										required
										className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
										placeholder="123 Main Street"
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="city"
											className="block text-sm font-medium text-stone-700"
										>
											City
										</label>
										<input
											type="text"
											id="city"
											name="city"
											required
											className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
											placeholder="New York"
										/>
									</div>

									<div>
										<label
											htmlFor="state"
											className="block text-sm font-medium text-stone-700"
										>
											State
										</label>
										<input
											type="text"
											id="state"
											name="state"
											required
											className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
											placeholder="NY"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="zipCode"
											className="block text-sm font-medium text-stone-700"
										>
											ZIP Code
										</label>
										<input
											type="text"
											id="zipCode"
											name="zipCode"
											required
											className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
											placeholder="10001"
										/>
									</div>

									<div>
										<label
											htmlFor="country"
											className="block text-sm font-medium text-stone-700"
										>
											Country
										</label>
										<input
											type="text"
											id="country"
											name="country"
											required
											className="mt-1.5 block h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm shadow-xs transition-[box-shadow] placeholder:text-stone-400 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
											placeholder="United States"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col-reverse items-stretch gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
						<a
							href="/pricing"
							className="text-center text-sm font-medium text-stone-600 hover:text-stone-900"
						>
							← Back to pricing
						</a>
						<button
							type="submit"
							className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
						>
							Complete Purchase - ${amount / 100}/month
						</button>
					</div>
				</form>
			</div>
		</main>
	);
}

export default function CheckoutPage({
	searchParams,
}: {
	searchParams: Promise<{ plan?: string; amount?: string }>;
}) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CheckoutForm searchParams={searchParams} />
		</Suspense>
	);
}
