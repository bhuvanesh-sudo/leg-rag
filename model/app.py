from chain import qa_chain

while True:
    q = input(">> ")
    if q == "exit":
        break
    result = qa_chain.invoke({"query": q})

    print("\nAnswer:")
    print(result["result"])

    '''print("\nSources:")
    for doc in result["source_documents"]:
        print("\n--- SOURCE ---")
        print(doc.page_content)
    '''
    