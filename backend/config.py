"""
Configuration settings for the backend application.
"""

from dotenv import find_dotenv, load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from urllib.parse import urlparse
from typing import Optional


# Load environment variables from a local .env (searched upward from CWD).
load_dotenv(find_dotenv(usecwd=True))


class S3Config(BaseSettings):
    """S3 configuration settings with validation."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    bucket_url: str = Field(..., validation_alias="BUCKET_URL", description="Full bucket URL (e.g., https://medsight.atl1.digitaloceanspaces.com)")
    bucket_access_key: str = Field(..., validation_alias="BUCKET_ACCESS_KEY", description="S3 access key")
    bucket_secret_key: str = Field(..., validation_alias="BUCKET_SECRET_KEY", description="S3 secret key")
    bucket_name: Optional[str] = Field(None, validation_alias="BUCKET_NAME", description="Bucket name (optional, can be extracted from URL)")
    bucket_region: Optional[str] = Field(None, validation_alias="BUCKET_REGION", description="Region name (optional, can be extracted from URL)")
    
    @field_validator("bucket_url")
    @classmethod
    def validate_bucket_url(cls, v: str) -> str:
        """Validate bucket URL format."""
        if not v:
            raise ValueError("BUCKET_URL must be provided")
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.hostname:
            raise ValueError("BUCKET_URL must be a valid URL with scheme and hostname")
        if parsed.scheme not in ("http", "https"):
            raise ValueError("BUCKET_URL must use http or https scheme")
        return v
    
    @field_validator("bucket_access_key")
    @classmethod
    def validate_access_key(cls, v: str) -> str:
        """Validate access key is not empty."""
        if not v or not v.strip():
            raise ValueError("BUCKET_ACCESS_KEY must be provided and non-empty")
        return v.strip()
    
    @field_validator("bucket_secret_key")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validate secret key is not empty."""
        if not v or not v.strip():
            raise ValueError("BUCKET_SECRET_KEY must be provided and non-empty")
        return v.strip()
    
    def model_post_init(self, __context) -> None:
        """Extract bucket name and region from URL if not provided."""
        # Extract bucket name and region from URL if not provided
        if not self.bucket_name or not self.bucket_region:
            parsed_url = urlparse(self.bucket_url)
            hostname = parsed_url.hostname or ""
            
            # DigitalOcean Spaces URL format: https://<bucket>.<region>.digitaloceanspaces.com
            # or https://<region>.digitaloceanspaces.com/<bucket>
            if not self.bucket_name:
                if "." in hostname:
                    # Format: bucket.region.digitaloceanspaces.com
                    parts = hostname.split(".")
                    if len(parts) >= 3:
                        self.bucket_name = parts[0]
                    else:
                        # Try to extract from path
                        path_parts = parsed_url.path.strip("/").split("/")
                        if path_parts and path_parts[0]:
                            self.bucket_name = path_parts[0]
                        else:
                            raise ValueError("Could not extract bucket name from URL. Please set BUCKET_NAME.")
                else:
                    raise ValueError("Could not extract bucket name from URL. Please set BUCKET_NAME.")
            
            if not self.bucket_region:
                # Extract region from hostname (e.g., atl1 from medsight.atl1.digitaloceanspaces.com)
                parts = hostname.split(".")
                if len(parts) >= 2:
                    self.bucket_region = parts[1] if parts[1] != "digitaloceanspaces" else "nyc3"
                else:
                    self.bucket_region = "nyc3"  # Default region


# Global S3 config instance
_s3_config: Optional[S3Config] = None


def get_s3_config() -> S3Config:
    """Get or create the global S3 config instance."""
    global _s3_config
    if _s3_config is None:
        _s3_config = S3Config()
    return _s3_config
