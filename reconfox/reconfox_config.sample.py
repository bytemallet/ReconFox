# CONFIG FILE

postgress_sql = {
	'DB_NAME': 'infohound_db',
	'DB_USER': 'postgres',
	'DB_PASSWORD': 'postgres',
	'DB_HOST': 'localhost',
	'DB_PORT': '5432',
}


#------------ 3rd Party -----------
SHODAN_KEY = "" #currently not used
LEAK_LOOKUP_KEY = ""

#------------- GOOGLE -------------
GOOGLE_API_KEY = ""
GOOGLE_ID = ""


AI_METHOD = "" #LOCAL (ollama) OR REMOTE (openai)

#------------- OPENAI -------------
OPENAI_API_KEY = ""

#------------- OLLAMA -------------
OLLAMA_URL = 'http://ollama:11434'
OLLAMA_MODEL = 'llama2'
