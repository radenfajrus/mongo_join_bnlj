for file in ./*.json
do
  name=${file##*/}
  base=${name%.json}
  mongoimport $@ --collection "${base}" --file ./"${base}.json" --jsonArray 
done

# sh mongo.sh  --uri "mongodb://admin:admin@m1:17013/tpch_unsharded?authSource=admin&ssl=false"
# sh mongo.sh  --uri "mongodb://admin:admin@m1:17013/tpch?authSource=admin&ssl=false"