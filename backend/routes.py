from flask import request, jsonify
from datetime import datetime
from db import problem_sets, student_answers, chat_history, llm_mappings, experiments

def register_routes(app):
    
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({"message": "Flask backend is running!"})

    
    @app.route("/api/submit-answer", methods=["POST"])
    def submit_answer():
        try:
            data = request.get_json()
            required = ["student_id", "question_id", "selected_answer"]
            if not all(field in data for field in required):
                return jsonify({"error": "Missing fields"}), 400

            student_id = data["student_id"]
            question_id = data["question_id"]

            # Count previous attempts
            attempt_count = student_answers.count_documents({
                "student_id": student_id,
                "question_id": question_id
            })

            data["submitted_at"] = datetime.utcnow()
            data["attempt_number"] = attempt_count + 1  # 1-based count

            student_answers.insert_one(data)
            return jsonify({"message": "Answer submitted", "attempt_number": data["attempt_number"]}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @app.route("/api/save-chat", methods=["POST"])
    def save_chat():
        try:
            data = request.get_json()
            required = ["student_id", "question_id", "llm_used", "chat"]
            if not all(field in data for field in required):
                return jsonify({"error": "Missing fields"}), 400
            chat_doc = {
                "student_id": data["student_id"],
                "question_id": data["question_id"],
                "llm_used": data["llm_used"],
                "chat": data["chat"],
                "session_start": data["chat"][0]["timestamp"],
                "session_end": data["chat"][-1]["timestamp"]
            }
            chat_history.insert_one(chat_doc)
            return jsonify({"message": "Chat saved"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/problem-set/<question_id>", methods=["GET"])
    def get_problem_set(question_id):
        try:
            problem = problem_sets.find_one({"question_id": question_id}, {"_id": 0})
            if not problem:
                return jsonify({"error": "Not found"}), 404
            return jsonify(problem)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/add-question", methods=["POST"])
    def add_question():
        try:
            data = request.get_json()
            required = ["section", "difficulty", "question_text", "options", "correct_answer"]
            if not all(field in data for field in required):
                return jsonify({"error": "Missing fields"}), 400
            data["created_at"] = datetime.utcnow()
            problem_sets.insert_one(data)
            return jsonify({"message": "Question added"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/questions", methods=["GET"])
    def get_questions():
        try:
            query = {}
            section = request.args.get("section")
            difficulty = request.args.get("difficulty")
            if section:
                query["section"] = section
            if difficulty:
                query["difficulty"] = difficulty
            results = list(problem_sets.find(query, {"_id": 0}))
            return jsonify(results)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/llm-mapping", methods=["POST"])
    def add_llm_mapping():
        try:
            data = request.get_json()
            required = ["llm_id", "display_name", "prompt"]
            if not all(field in data for field in required):
                return jsonify({"error": "Missing fields"}), 400
            data["created_at"] = datetime.utcnow()
            llm_mappings.insert_one(data)
            return jsonify({"message": "LLM mapping saved"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/llm-mapping", methods=["GET"])
    def get_llm_mappings():
        try:
            mappings = list(llm_mappings.find({}, {"_id": 0}))
            return jsonify(mappings)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/question/<question_id>", methods=["PUT"])
    def update_question(question_id):
        try:
            data = request.get_json()
            result = problem_sets.update_one({"question_id": question_id}, {"$set": data})
            if result.matched_count == 0:
                return jsonify({"error": "Question not found"}), 404
            return jsonify({"message": "Question updated"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/question/<question_id>", methods=["DELETE"])
    def delete_question(question_id):
        try:
            result = problem_sets.delete_one({"question_id": question_id})
            if result.deleted_count == 0:
                return jsonify({"error": "Question not found"}), 404
            return jsonify({"message": "Question deleted"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    @app.route("/api/attempts", methods=["GET"])
    def get_attempts():
        try:
            student_id = request.args.get("student_id")
            question_id = request.args.get("question_id")
            
            if not student_id or not question_id:
                return jsonify({"error": "Missing student_id or question_id"}), 400
            
            query = {
                "student_id": student_id,
                "question_id": question_id
            }
            attempts = list(student_answers.find(query, {"_id": 0}))
            return jsonify({"attempts": attempts}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @app.route("/api/llm-mapping/<llm_id>", methods=["DELETE"])
    def delete_llm_mapping(llm_id):
        try:
            result = llm_mappings.delete_one({"llm_id": llm_id})
            if result.deleted_count == 0:
                return jsonify({"error": "LLM mapping not found"}), 404
            return jsonify({"message": "LLM mapping deleted"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/stats", methods=["GET"])
    def get_stats():
        try:
            return jsonify({
                "total_questions": problem_sets.count_documents({}),
                "total_answers": student_answers.count_documents({}),
                "total_chats": chat_history.count_documents({}),
                "total_llms": llm_mappings.count_documents({})
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    # @app.route("/api/experiments", methods=["POST"])
    # def create_experiment():
    #     try:
    #         data = request.get_json()
    #         required = ["experiment_id", "name", "llm_id", "llm_display_name", "distribution", "question_ids"]
    #         if not all(field in data for field in required):
    #             return jsonify({"error": "Missing required fields"}), 400

    #         data["created_at"] = datetime.utcnow()
    #         experiments.insert_one(data)
    #         return jsonify({"message": "Experiment created"}), 201
    #     except Exception as e:
    #         return jsonify({"error": str(e)}), 500

    # @app.route("/api/experiments", methods=["GET"])
    # def get_experiments():
    #     try:
    #         results = list(experiments.find({}, {"_id": 0}).sort("created_at", -1))
    #         return jsonify(results), 200
    #     except Exception as e:
    #         return jsonify({"error": str(e)}), 500

    # @app.route("/api/experiments/<experiment_id>", methods=["GET"])
    # def get_experiment(experiment_id):
    #     try:
    #         exp = experiments.find_one({"experiment_id": experiment_id}, {"_id": 0})
    #         if not exp:
    #             return jsonify({"error": "Experiment not found"}), 404
    #         return jsonify(exp), 200
    #     except Exception as e:
    #         return jsonify({"error": str(e)}), 500

    # @app.route("/api/experiments/<experiment_id>", methods=["DELETE"])
    # def delete_experiment(experiment_id):
    #     try:
    #         result = experiments.delete_one({"experiment_id": experiment_id})
    #         if result.deleted_count == 0:
    #             return jsonify({"error": "Experiment not found"}), 404
    #         return jsonify({"message": "Experiment deleted"}), 200
    #     except Exception as e:
    #         return jsonify({"error": str(e)}), 500

    # @app.route("/api/experiments/<experiment_id>", methods=["PUT"])
    # def update_experiment(experiment_id):
    #     try:
    #         data = request.get_json()
    #         result = experiments.update_one({"experiment_id": experiment_id}, {"$set": data})
    #         if result.matched_count == 0:
    #             return jsonify({"error": "Experiment not found"}), 404
    #         return jsonify({"message": "Experiment updated"}), 200
    #     except Exception as e:
    #         return jsonify({"error": str(e)}), 500

    # @app.route("/api/results/<experiment_id>", methods=["GET"])
    # def get_results(experiment_id):
    #     try:
    #         experiment = experiments.find_one({"experiment_id": experiment_id})
    #         if not experiment:
    #             return jsonify({"error": "Experiment not found"}), 404

    #         q_ids = experiment.get("question_ids", [])
    #         results = []
    #         score = 0

    #         for qid in q_ids:
    #             question = problem_sets.find_one({"question_id": qid})
    #             if not question:
    #                 continue
    #             answers = list(student_answers.find({"question_id": qid}))
    #             correct = sum(1 for ans in answers if ans.get("selected_answer") == question.get("correct_answer"))
    #             total = len(answers)
    #             results.append({
    #                 "question_id": qid,
    #                 "correct": correct,
    #                 "total": total,
    #                 "question_text": question.get("question_text")
    #             })
    #             score += correct

    #         return jsonify({
    #             "experiment_id": experiment_id,
    #             "total_score": score,
    #             "breakdown": results
    #         }), 200

    #     except Exception as e:
    #         return jsonify({"error": str(e)}), 500

