import numpy as np

def compare_faces(stored_encoding:list,query_encoding:list,threshold:float=1.3)->bool:
    stored=np.array(stored_encoding)
    query=np.array(query_encoding)
    distance=np.linalg.norm(stored-query)
    return distance<threshold

def find_matching_user(users:list,query_encoding:list,threshold:float=1.3):
    query=np.array(query_encoding)
    best_match=None
    best_distance=float("inf")
    for user in users:
        if not user.get("face_encoding"):
            continue
        stored=np.array(user["face_encoding"])
        distance=np.linalg.norm(query-stored)
        if distance<threshold and distance<best_distance:
            best_distance=distance
            best_match=user
    return best_match