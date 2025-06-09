from flask import request, jsonify
from datetime import datetime
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# MongoDB connection
uri = "mongodb+srv://isharma09:ZboaacN4uBKmaKPc@cluster0.vipnvfj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['chatbot']

# Collections
problem_sets = db['problem_sets']
student_answers = db['student_answers']
chat_history = db['chat_history']
llm_mappings = db['llm_mappings']
experiments = db['experiments']


