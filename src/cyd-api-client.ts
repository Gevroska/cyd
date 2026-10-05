// Desktop-scoped API client for cyd.
// Keep this file limited to methods and models used by desktop code.

// API error response
export type APIErrorResponse = {
  error: boolean;
  message: string;
  status?: number;
};

// API models for POST /authenticate
export type AuthAPIRequest = {
  email: string;
};

// API models for POST /device
export type RegisterDeviceAPIRequest = {
  email: string;
  verification_code: string;
  description: string;
  device_type: string;
};

export type RegisterDeviceAPIResponse = {
  uuid: string;
  device_token: string;
};

// API models for POST /token
export type TokenAPIRequest = {
  email: string;
  device_token: string;
};

export type TokenAPIResponse = {
  api_token: string;
  device_uuid: string;
  email: string;
};

// API models for DELETE /device
export type DeleteDeviceAPIRequest = {
  uuid: string;
};

// API models for POST /x-progress
export type PostXProgressAPIRequest = {
  account_uuid: string;
  total_tweets_indexed: number;
  total_tweets_archived: number;
  total_retweets_indexed: number;
  total_likes_indexed: number;
  total_bookmarks_indexed: number;
  total_unknown_indexed: number;
  total_tweets_deleted: number;
  total_retweets_deleted: number;
  total_likes_deleted: number;
  total_bookmarks_deleted: number;
  total_conversations_deleted: number;
  total_accounts_unfollowed: number;
  total_tweets_migrated_to_bluesky: number;
};

// API models for POST /facebook-progress
export type PostFacebookProgressAPIRequest = {
  account_uuid: string;
  total_wall_posts_deleted: number;
  total_wall_posts_untagged: number;
  total_wall_posts_hidden: number;
};

export type BillingPeriod = "annual" | "monthly";
export type CurrentBillingPeriod = BillingPeriod | "none";

// API models for GET /user/premium
export type UserPremiumAPIResponse = {
  premium_price_annual_cents: number;
  premium_price_monthly_cents: number;
  premium_business_price_cents: number;
  premium_access: boolean;
  has_individual_subscription: boolean;
  subscription_cancel_at_period_end: boolean;
  subscription_current_period_end: string | null;
  has_business_subscription: boolean;
  business_organizations: string[];
  current_billing_period: CurrentBillingPeriod;
  partner: boolean;
  stored_credit_cents: number;
};

// API models for POST /automation-error-report
export type PostAutomationErrorReportAPIRequest = {
  app_version: string;
  client_platform: string;
  account_type: string;
  error_report_type: string;
  error_report_data: object;
  account_username?: string;
  screenshot_data_uri?: string;
  sensitive_context_data?: object;
};

// API models for POST /newsletter
export type PostNewsletterAPIRequest = {
  email: string;
};

// API models for GET /version
export type GetVersionAPIResponse = {
  version: string;
};

// Legacy desktop interfaces remain for compatibility with upstream view models.
// This fork has no Cyd service transport, token storage, or reporting queue.
export default class CydAPIClient {
  public apiURL: string | null = null;

  initialize(_APIURL: string): void {}
  setUserEmail(_userEmail: string): void {}
  async setDeviceToken(_deviceToken: string): Promise<void> {}

  returnError(message: string, status?: number): APIErrorResponse {
    return { error: true, message, status };
  }

  private disabled(): APIErrorResponse {
    return this.returnError(
      "This Cyd fork runs without Cyd accounts or online reporting.",
    );
  }

  async getNewAPIToken(): Promise<boolean> {
    return false;
  }
  async validateAPIToken(): Promise<boolean> {
    return false;
  }
  async authenticate(
    _request: AuthAPIRequest,
  ): Promise<boolean | APIErrorResponse> {
    return this.disabled();
  }
  async registerDevice(
    _request: RegisterDeviceAPIRequest,
  ): Promise<RegisterDeviceAPIResponse | APIErrorResponse> {
    return this.disabled();
  }
  async getToken(
    _request: TokenAPIRequest,
  ): Promise<TokenAPIResponse | APIErrorResponse> {
    return this.disabled();
  }
  async deleteDevice(
    _request: DeleteDeviceAPIRequest,
  ): Promise<void | APIErrorResponse> {}
  async ping(): Promise<boolean> {
    return false;
  }
  async postXProgress(
    _request: PostXProgressAPIRequest,
    _authenticated: boolean,
  ): Promise<boolean | APIErrorResponse> {
    return false;
  }
  async postFacebookProgress(
    _request: PostFacebookProgressAPIRequest,
    _authenticated: boolean,
  ): Promise<boolean | APIErrorResponse> {
    return false;
  }
  async getUserPremium(): Promise<UserPremiumAPIResponse | APIErrorResponse> {
    return this.disabled();
  }
  async postAutomationErrorReport(
    _request: PostAutomationErrorReportAPIRequest,
    _authenticated: boolean,
  ): Promise<boolean | APIErrorResponse> {
    return this.disabled();
  }
  async postNewsletter(
    _request: PostNewsletterAPIRequest,
  ): Promise<boolean | APIErrorResponse> {
    return this.disabled();
  }
  async postUserActivity(): Promise<boolean | APIErrorResponse> {
    return false;
  }
  async getVersion(): Promise<GetVersionAPIResponse | APIErrorResponse> {
    return this.disabled();
  }
}
