import { relations } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { BIKE_TYPES, BOOKING_SLOTS } from "../bike-format";

export {
	BIKE_TYPES,
	type BikeType,
	BOOKING_SLOTS,
	type BookingSlot,
} from "../bike-format";

export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name"),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: text("role").notNull().default("member"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const teams = sqliteTable("teams", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	planName: text("plan_name"),
	subscriptionStatus: text("subscription_status"),
	/** Authenticates calls to the Fleet API. Only owners can see it. */
	apiKey: text("api_key").unique(),
});

export const teamMembers = sqliteTable("team_members", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id),
	teamId: integer("team_id")
		.notNull()
		.references(() => teams.id),
	role: text("role").notNull(),
	joinedAt: integer("joined_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const activityLogs = sqliteTable("activity_logs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	teamId: integer("team_id")
		.notNull()
		.references(() => teams.id),
	userId: integer("user_id").references(() => users.id, {
		onDelete: "cascade",
	}),
	action: text("action").notNull(),
	/** What the action was about, e.g. "Road 1, Thu 27 Nov, morning". */
	detail: text("detail"),
	timestamp: integer("timestamp", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	ipAddress: text("ip_address"),
});

export const invitations = sqliteTable("invitations", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	teamId: integer("team_id")
		.notNull()
		.references(() => teams.id),
	email: text("email").notNull(),
	role: text("role").notNull(),
	invitedBy: integer("invited_by")
		.notNull()
		.references(() => users.id),
	invitedAt: integer("invited_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	status: text("status").notNull().default("pending"),
});

export const payments = sqliteTable("payments", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	teamId: integer("team_id")
		.notNull()
		.references(() => teams.id),
	cardNumber: text("card_number").notNull(),
	cardHolderName: text("card_holder_name").notNull(),
	expiryDate: text("expiry_date").notNull(),
	cvv: text("cvv").notNull(),
	billingAddress: text("billing_address").notNull(),
	city: text("city").notNull(),
	state: text("state").notNull(),
	zipCode: text("zip_code").notNull(),
	country: text("country").notNull(),
	planName: text("plan_name").notNull(),
	amount: integer("amount").notNull(),
	currency: text("currency").notNull().default("USD"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const bikes = sqliteTable(
	"bikes",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		teamId: integer("team_id")
			.notNull()
			.references(() => teams.id),
		name: text("name").notNull(),
		type: text("type", { enum: BIKE_TYPES }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		uniqueIndex("bikes_team_name_unique").on(table.teamId, table.name),
	],
);

export const bookings = sqliteTable(
	"bookings",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		teamId: integer("team_id")
			.notNull()
			.references(() => teams.id),
		bikeId: integer("bike_id")
			.notNull()
			.references(() => bikes.id, { onDelete: "cascade" }),
		userId: integer("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		/** The day of the booking, as YYYY-MM-DD. */
		date: text("date").notNull(),
		slot: text("slot", { enum: BOOKING_SLOTS }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		// A bike can only be booked once per slot.
		uniqueIndex("bookings_bike_date_slot_unique").on(
			table.bikeId,
			table.date,
			table.slot,
		),
		index("bookings_team_date_idx").on(table.teamId, table.date),
	],
);

export const teamsRelations = relations(teams, ({ many }) => ({
	teamMembers: many(teamMembers),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	payments: many(payments),
	bikes: many(bikes),
}));

export const usersRelations = relations(users, ({ many }) => ({
	teamMembers: many(teamMembers),
	invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id],
	}),
	invitedBy: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id],
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	team: one(teams, {
		fields: [activityLogs.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id],
	}),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
	team: one(teams, {
		fields: [payments.teamId],
		references: [teams.id],
	}),
}));

export const bikesRelations = relations(bikes, ({ one, many }) => ({
	team: one(teams, {
		fields: [bikes.teamId],
		references: [teams.id],
	}),
	bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
	bike: one(bikes, {
		fields: [bookings.bikeId],
		references: [bikes.id],
	}),
	user: one(users, {
		fields: [bookings.userId],
		references: [users.id],
	}),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Bike = typeof bikes.$inferSelect;
export type NewBike = typeof bikes.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type TeamDataWithMembers = Omit<Team, "apiKey"> & {
	teamMembers: (TeamMember & {
		user: Pick<User, "id" | "name" | "email">;
	})[];
};

export enum ActivityType {
	SIGN_UP = "SIGN_UP",
	SIGN_IN = "SIGN_IN",
	SIGN_OUT = "SIGN_OUT",
	UPDATE_PASSWORD = "UPDATE_PASSWORD",
	DELETE_ACCOUNT = "DELETE_ACCOUNT",
	UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
	CREATE_TEAM = "CREATE_TEAM",
	REMOVE_TEAM_MEMBER = "REMOVE_TEAM_MEMBER",
	INVITE_TEAM_MEMBER = "INVITE_TEAM_MEMBER",
	ACCEPT_INVITATION = "ACCEPT_INVITATION",
	BOOK_BIKE = "BOOK_BIKE",
	CANCEL_BOOKING = "CANCEL_BOOKING",
}
