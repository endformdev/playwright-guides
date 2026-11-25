"use client";

import { Loader2, Lock, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { deleteAccount, updatePassword } from "@/app/(login)/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordState = {
	currentPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
	error?: string;
	success?: string;
};

type DeleteState = {
	password?: string;
	error?: string;
	success?: string;
};

export default function SecurityPage() {
	const [passwordState, passwordAction, isPasswordPending] = useActionState<
		PasswordState,
		FormData
	>(updatePassword, {});

	const [deleteState, deleteAction, isDeletePending] = useActionState<
		DeleteState,
		FormData
	>(deleteAccount, {});

	return (
		<section>
			<PageHeader
				title="Security Settings"
				description="Change your password or delete your account."
			/>
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Password</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" action={passwordAction}>
						<div>
							<Label htmlFor="current-password" className="mb-2">
								Current Password
							</Label>
							<Input
								id="current-password"
								name="currentPassword"
								type="password"
								autoComplete="current-password"
								required
								minLength={8}
								maxLength={100}
								defaultValue={passwordState.currentPassword}
							/>
						</div>
						<div>
							<Label htmlFor="new-password" className="mb-2">
								New Password
							</Label>
							<Input
								id="new-password"
								name="newPassword"
								type="password"
								autoComplete="new-password"
								required
								minLength={8}
								maxLength={100}
								defaultValue={passwordState.newPassword}
							/>
						</div>
						<div>
							<Label htmlFor="confirm-password" className="mb-2">
								Confirm New Password
							</Label>
							<Input
								id="confirm-password"
								name="confirmPassword"
								type="password"
								required
								minLength={8}
								maxLength={100}
								defaultValue={passwordState.confirmPassword}
							/>
						</div>
						{passwordState.error && (
							<p className="text-red-600 text-sm">{passwordState.error}</p>
						)}
						{passwordState.success && (
							<p className="text-brand-700 font-medium text-sm">
								{passwordState.success}
							</p>
						)}
						<Button type="submit" disabled={isPasswordPending}>
							{isPasswordPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								<>
									<Lock className="mr-2 h-4 w-4" />
									Update Password
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card className="border-red-200">
				<CardHeader>
					<CardTitle className="text-red-700">Delete Account</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-stone-500 mb-4">
						Deleting your account can't be undone, and your bookings go with it.
					</p>
					<form action={deleteAction} className="space-y-4">
						<div>
							<Label htmlFor="delete-password" className="mb-2">
								Confirm Password
							</Label>
							<Input
								id="delete-password"
								name="password"
								type="password"
								required
								minLength={8}
								maxLength={100}
								defaultValue={deleteState.password}
							/>
						</div>
						{deleteState.error && (
							<p className="text-red-600 text-sm">{deleteState.error}</p>
						)}
						<Button
							type="submit"
							variant="destructive"
							disabled={isDeletePending}
						>
							{isDeletePending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Account
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</section>
	);
}
