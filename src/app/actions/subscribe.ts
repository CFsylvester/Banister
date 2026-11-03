"use server";
import { headers } from "next/headers";
import { ezekia } from "@/lib/ezekia";
import { subscribeToList } from "@/lib/ezekia/subscribe";
import { clientIpKey } from "@/lib/rate-limit";
import { createSignupGuard, handleSubscribe, type SubscribeResult } from "@/lib/subscribe-handler";

/** Ezekia list "Website Sign Up - Whitepaper" (https://ezekia.com/#/lists/1003445/info). */
const SIGNUP_LIST_ID = 1003445;

const guard = createSignupGuard();

/** The yellow sign-up band (SubscribeBand) calls this. Validation is repeated here: the client's can be skipped. */
export async function subscribe(form: FormData): Promise<SubscribeResult> {
  return handleSubscribe(form, {
    ipKey: async () => clientIpKey(await headers()),
    guard,
    addToList: (email) => subscribeToList(ezekia(), SIGNUP_LIST_ID, email),
  });
}
