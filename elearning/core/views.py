from django.shortcuts import render

# Create your views here.
# this function is used to redirect to the index teamplate located in templates/core/index.html
def index(request):
    return render(request, "core/index.html")
