from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import asyncio
import aiohttp
import feedparser
from passlib.context import CryptContext
from jose import jwt, JWTError
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'arabismart_db')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'arabismart_secret_key')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="ArabiSmart API", version="1.1.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== RSS Cache System ==============
rss_cache = {
    "articles": [],
    "last_update": 0,
    "cache_duration": 600  # 10 minutes
}

# ============== RSS Sources ==============
RSS_SOURCES = [
    # ========== مصادر عربية في السويد (SE) ==========
    {"name": "الكومبس", "url": "https://alkompis.se/feed", "language": "ar", "category": "SE"},
    {"name": "راديو السويد العربي", "url": "https://api.sr.se/api/v2/episodes/index.xml?programid=2494", "language": "ar", "category": "SE"},
    {"name": "أكتر", "url": "https://aktarr.se/feed", "language": "ar", "category": "SE"},
    {"name": "Swed24", "url": "https://www.swed24.se/feed", "language": "ar", "category": "SE"},
    {"name": "المركز السويدي للمعلومات", "url": "https://www.centersweden.com/feed", "language": "ar", "category": "SE"},
    
    # ========== مصادر عربية دولية ==========
    {"name": "الجزيرة", "url": "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779", "language": "ar", "category": "عام"},
    {"name": "الجزيرة - أخبار عاجلة", "url": "https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779", "language": "ar", "category": "عاجل"},
    {"name": "سكاي نيوز عربية", "url": "https://www.skynewsarabia.com/rss.xml", "language": "ar", "category": "عام"},
    {"name": "العربية", "url": "https://www.alarabiya.net/.mrss/ar/all.xml", "language": "ar", "category": "عام"},
    {"name": "روسيا اليوم RT عربي", "url": "https://arabic.rt.com/rss", "language": "ar", "category": "عام"},
    {"name": "فرانس 24 عربي", "url": "https://www.france24.com/ar/rss", "language": "ar", "category": "عام"},
    {"name": "بي بي سي عربي", "url": "https://feeds.bbci.co.uk/arabic/rss.xml", "language": "ar", "category": "عام"},
    
    # ========== مصادر سويدية (SE) ==========
    {"name": "Dagens Nyheter", "url": "https://www.dn.se/rss", "language": "sv", "category": "SE"},
    {"name": "Svenska Dagbladet", "url": "https://www.svd.se/feed/articles.rss", "language": "sv", "category": "SE"},
    {"name": "SVT Nyheter", "url": "https://www.svt.se/rss.xml", "language": "sv", "category": "SE"},
    {"name": "Expressen", "url": "https://feeds.expressen.se/nyheter", "language": "sv", "category": "SE"},
    {"name": "Göteborgs-Posten", "url": "https://www.gp.se/feeds/feed.xml", "language": "sv", "category": "SE"},
    {"name": "Sydsvenskan", "url": "https://www.sydsvenskan.se/feeds/feed.xml", "language": "sv", "category": "SE"},
    {"name": "Aftonbladet", "url": "https://www.aftonbladet.se/rss", "language": "sv", "category": "SE"},
    
    # ========== مصادر دولية بالإنجليزية ==========
    {"name": "BBC World", "url": "https://feeds.bbci.co.uk/news/world/rss.xml", "language": "en", "category": "دولي"},
    {"name": "Reuters", "url": "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best", "language": "en", "category": "دولي"},
    {"name": "CNN International", "url": "http://rss.cnn.com/rss/edition.rss", "language": "en", "category": "دولي"},
]

# ============== Category Keywords ==============
CATEGORY_KEYWORDS = {
    "سياسة": ["حكومة", "رئيس", "وزير", "برلمان", "انتخاب", "سياس", "حزب", "government", "president", "minister", "election", "parliament", "politik", "regering"],
    "اقتصاد": ["اقتصاد", "بنك", "أسهم", "بورصة", "نفط", "دولار", "يورو", "تجار", "economy", "bank", "stock", "oil", "dollar", "trade", "ekonomi", "handel"],
    "رياضة": ["رياض", "كرة", "ميسي", "رونالدو", "دوري", "بطولة", "منتخب", "football", "soccer", "champion", "match", "sport", "fotboll", "match"],
    "تكنولوجيا": ["تقن", "تكنولوج", "ذكاء اصطناعي", "هاتف", "آيفون", "أندرويد", "جوجل", "أبل", "tech", "AI", "phone", "apple", "google", "teknik", "mobil"],
    "صحة": ["صح", "طب", "مرض", "فيروس", "علاج", "مستشفى", "طبيب", "health", "medical", "doctor", "hospital", "virus", "hälsa", "sjukhus"],
    "ثقافة": ["ثقاف", "فن", "سينما", "مسرح", "موسيق", "كتاب", "رواي", "culture", "art", "cinema", "music", "book", "kultur", "konst"],
}

# ============== Pydantic Models ==============
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    favorites: List[str] = []
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    link: str = ""
    source: str = ""
    source_language: str = "ar"
    category: str = "عام"
    image: Optional[str] = None
    published_date: Optional[datetime] = None
    guid: str = ""
    is_translated: bool = False
    is_summarized: bool = False
    summary: Optional[str] = None
    translated_title: Optional[str] = None
    translated_description: Optional[str] = None

class FavoriteAdd(BaseModel):
    article_id: str

# ============== Helper Functions ==============
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        user = await db.users.find_one({"email": email})
        return user
    except JWTError:
        return None

async def get_required_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="غير مصرح")
    return user

def classify_article(title: str, description: str) -> str:
    """Classify article based on keywords"""
    text = f"{title} {description}".lower()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword.lower() in text)
        if score > 0:
            scores[category] = score
    if scores:
        return max(scores, key=scores.get)
    return "عام"

def extract_image(entry) -> Optional[str]:
    """Extract image URL from RSS entry"""
    # Check media:content
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if 'url' in media:
                return media['url']
    # Check media:thumbnail
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        for thumb in entry.media_thumbnail:
            if 'url' in thumb:
                return thumb['url']
    # Check enclosures
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enclosure in entry.enclosures:
            if enclosure.get('type', '').startswith('image'):
                return enclosure.get('url')
    # Check links
    if hasattr(entry, 'links'):
        for link in entry.links:
            if link.get('type', '').startswith('image'):
                return link.get('href')
    return None

async def fetch_rss_feed(source: dict) -> List[dict]:
    """Fetch RSS feed from a single source"""
    articles = []
    try:
        timeout = aiohttp.ClientTimeout(total=10)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(source['url']) as response:
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)
                    
                    for entry in feed.entries[:15]:  # Limit to 15 per source
                        published = None
                        if hasattr(entry, 'published_parsed') and entry.published_parsed:
                            try:
                                published = datetime(*entry.published_parsed[:6])
                            except:
                                published = datetime.utcnow()
                        
                        title = entry.get('title', '')
                        description = entry.get('summary', entry.get('description', ''))
                        
                        # Remove HTML tags from description
                        import re
                        description = re.sub('<[^<]+?>', '', description)[:500]
                        
                        article = {
                            "id": str(uuid.uuid4()),
                            "title": title,
                            "description": description,
                            "link": entry.get('link', ''),
                            "source": source['name'],
                            "source_language": source['language'],
                            "category": classify_article(title, description) if source['category'] == 'عام' else source['category'],
                            "image": extract_image(entry),
                            "published_date": published,
                            "guid": entry.get('id', entry.get('link', str(uuid.uuid4()))),
                            "is_translated": False,
                            "is_summarized": False
                        }
                        articles.append(article)
                        
    except Exception as e:
        logger.error(f"Error fetching {source['name']}: {str(e)}")
    
    return articles

async def fetch_all_news() -> List[dict]:
    """Fetch news from all sources"""
    current_time = time.time()
    
    # Check cache
    if rss_cache["articles"] and (current_time - rss_cache["last_update"]) < rss_cache["cache_duration"]:
        return rss_cache["articles"]
    
    # Fetch from all sources in parallel
    tasks = [fetch_rss_feed(source) for source in RSS_SOURCES]
    results = await asyncio.gather(*tasks)
    
    # Flatten and sort by date
    all_articles = []
    for articles in results:
        all_articles.extend(articles)
    
    # Sort by published date (newest first)
    all_articles.sort(key=lambda x: x.get('published_date') or datetime.min, reverse=True)
    
    # Update cache
    rss_cache["articles"] = all_articles
    rss_cache["last_update"] = current_time
    
    return all_articles

# ============== AI Functions ==============
async def translate_text(text: str, source_lang: str = "en") -> str:
    """Translate text to Arabic using AI"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return text
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"translate_{uuid.uuid4()}",
            system_message="أنت مترجم محترف. ترجم النص التالي إلى اللغة العربية الفصحى. لا تضف أي تعليقات أو شروحات، فقط الترجمة."
        ).with_model("openai", "gpt-5.2")
        
        lang_name = "الإنجليزية" if source_lang == "en" else "السويدية"
        message = UserMessage(text=f"ترجم من {lang_name} إلى العربية:\n{text}")
        response = await chat.send_message(message)
        return response.strip()
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return text

async def summarize_text(text: str) -> str:
    """Summarize text using AI"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return text[:200] + "..."
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"summarize_{uuid.uuid4()}",
            system_message="أنت ملخص أخبار محترف. لخص الخبر التالي في 2-3 جمل قصيرة بالعربية. ركز على المعلومات الأساسية فقط."
        ).with_model("openai", "gpt-5.2")
        
        message = UserMessage(text=f"لخص هذا الخبر:\n{text}")
        response = await chat.send_message(message)
        return response.strip()
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        return text[:200] + "..."

async def process_article_with_ai(article: dict) -> dict:
    """Process article with translation and summarization"""
    processed = article.copy()
    
    # Translate if not Arabic
    if article.get('source_language') != 'ar':
        translated_title = await translate_text(article['title'], article['source_language'])
        translated_desc = await translate_text(article['description'], article['source_language'])
        processed['translated_title'] = translated_title
        processed['translated_description'] = translated_desc
        processed['is_translated'] = True
        
        # Summarize the translated content
        content_to_summarize = f"{translated_title}\n{translated_desc}"
    else:
        content_to_summarize = f"{article['title']}\n{article['description']}"
    
    # Summarize
    summary = await summarize_text(content_to_summarize)
    processed['summary'] = summary
    processed['is_summarized'] = True
    
    return processed

# ============== API Routes ==============

@api_router.get("/")
async def root():
    return {"message": "مرحباً بك في ArabiSmart API", "version": "1.1.0"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "cache_articles": len(rss_cache["articles"]),
        "cache_age": time.time() - rss_cache["last_update"] if rss_cache["last_update"] else None
    }

# ============== Auth Routes ==============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "favorites": [],
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token({"sub": user_data.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            favorites=[],
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    access_token = create_access_token({"sub": credentials.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            favorites=user.get("favorites", []),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user=Depends(get_required_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        favorites=user.get("favorites", []),
        created_at=user["created_at"]
    )

# ============== News Routes ==============
@api_router.get("/news")
async def get_news(
    category: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50
):
    """Get all news articles"""
    articles = await fetch_all_news()
    
    # Filter by category
    if category and category != "الكل":
        articles = [a for a in articles if a.get('category') == category]
    
    # Filter by source
    if source:
        articles = [a for a in articles if a.get('source') == source]
    
    return {"articles": articles[:limit], "total": len(articles)}

@api_router.get("/news/{article_id}")
async def get_article(article_id: str):
    """Get single article by ID"""
    articles = await fetch_all_news()
    for article in articles:
        if article.get('id') == article_id:
            return article
    raise HTTPException(status_code=404, detail="الخبر غير موجود")

@api_router.get("/news/search/{query}")
async def search_news(query: str, limit: int = 30):
    """Search news articles"""
    articles = await fetch_all_news()
    query_lower = query.lower()
    
    results = [
        a for a in articles
        if query_lower in a.get('title', '').lower() 
        or query_lower in a.get('description', '').lower()
    ]
    
    return {"articles": results[:limit], "total": len(results), "query": query}

@api_router.get("/breaking-news")
async def get_breaking_news(limit: int = 10):
    """Get breaking news with AI translation and summarization"""
    articles = await fetch_all_news()
    
    # Get latest articles (mix of sources)
    latest = articles[:limit]
    
    # Process with AI
    processed = []
    for article in latest:
        try:
            processed_article = await process_article_with_ai(article)
            processed_article['is_breaking'] = True
            processed.append(processed_article)
        except Exception as e:
            logger.error(f"Error processing article: {str(e)}")
            article['is_breaking'] = True
            processed.append(article)
    
    return {"articles": processed, "total": len(processed)}

@api_router.get("/categories")
async def get_categories():
    """Get all available categories"""
    return {
        "categories": [
            {"id": "all", "name": "الكل", "icon": "newspaper"},
            {"id": "urgent", "name": "عاجل", "icon": "flash"},
            {"id": "politics", "name": "سياسة", "icon": "landmark"},
            {"id": "economy", "name": "اقتصاد", "icon": "trending-up"},
            {"id": "sports", "name": "رياضة", "icon": "trophy"},
            {"id": "tech", "name": "تكنولوجيا", "icon": "smartphone"},
            {"id": "health", "name": "صحة", "icon": "heart-pulse"},
            {"id": "culture", "name": "ثقافة", "icon": "palette"},
            {"id": "SE", "name": "SE", "icon": "flag"},
            {"id": "international", "name": "دولي", "icon": "globe"},
        ]
    }

@api_router.get("/sources")
async def get_sources():
    """Get all RSS sources"""
    return {"sources": RSS_SOURCES}

# ============== Favorites Routes ==============
@api_router.post("/favorites/add")
async def add_favorite(data: FavoriteAdd, user=Depends(get_required_user)):
    """Add article to favorites"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$addToSet": {"favorites": data.article_id}}
    )
    return {"success": True, "message": "تمت الإضافة للمفضلة"}

@api_router.post("/favorites/remove")
async def remove_favorite(data: FavoriteAdd, user=Depends(get_required_user)):
    """Remove article from favorites"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$pull": {"favorites": data.article_id}}
    )
    return {"success": True, "message": "تمت الإزالة من المفضلة"}

@api_router.get("/favorites")
async def get_favorites(user=Depends(get_required_user)):
    """Get user's favorite articles"""
    user_data = await db.users.find_one({"id": user["id"]})
    favorite_ids = user_data.get("favorites", [])
    
    if not favorite_ids:
        return {"articles": [], "total": 0}
    
    # Get articles from cache
    articles = await fetch_all_news()
    favorites = [a for a in articles if a.get('id') in favorite_ids]
    
    return {"articles": favorites, "total": len(favorites)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create indexes on startup
@app.on_event("startup")
async def startup_db_client():
    try:
        await db.users.create_index("email", unique=True)
        logger.info("Database indexes created")
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
