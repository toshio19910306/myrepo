use anyhow::Result;
use reqwest::Client;
use serde_json::json;

pub struct EmailService {
    client: Client,
    api_key: String,
}

impl EmailService {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
        }
    }

    pub async fn send_approval_notification(
        &self,
        to_email: &str,
        to_name: &str,
        subject: &str,
        approval_type: &str,
        target_title: &str,
        requester_name: &str,
    ) -> Result<()> {
        if self.api_key.is_empty() {
            return Ok(());
        }

        let email_body = format!(
            "{}様\n\n{}の{}が申請されました。\n\n件名: {}\n申請者: {}\n\nシステムにログインして確認してください。",
            to_name, approval_type, "承認", target_title, requester_name
        );

        let payload = json!({
            "personalizations": [{
                "to": [{"email": to_email, "name": to_name}],
                "subject": subject
            }],
            "from": {"email": "noreply@example.com", "name": "見積依頼システム"},
            "content": [{
                "type": "text/plain",
                "value": email_body
            }]
        });

        let response = self
            .client
            .post("https://api.sendgrid.com/v3/mail/send")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("メール送信に失敗しました: {}", response.status()));
        }

        Ok(())
    }

    pub async fn send_status_notification(
        &self,
        to_email: &str,
        to_name: &str,
        subject: &str,
        status: &str,
        target_title: &str,
        comments: Option<&str>,
    ) -> Result<()> {
        if self.api_key.is_empty() {
            return Ok(());
        }

        let mut email_body = format!(
            "{}様\n\n{}の状況が更新されました。\n\n件名: {}\n状況: {}",
            to_name, "申請", target_title, status
        );

        if let Some(comments) = comments {
            email_body.push_str(&format!("\nコメント: {}", comments));
        }

        email_body.push_str("\n\nシステムにログインして詳細を確認してください。");

        let payload = json!({
            "personalizations": [{
                "to": [{"email": to_email, "name": to_name}],
                "subject": subject
            }],
            "from": {"email": "noreply@example.com", "name": "見積依頼システム"},
            "content": [{
                "type": "text/plain",
                "value": email_body
            }]
        });

        let response = self
            .client
            .post("https://api.sendgrid.com/v3/mail/send")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("メール送信に失敗しました: {}", response.status()));
        }

        Ok(())
    }
}
